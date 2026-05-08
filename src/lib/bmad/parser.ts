import type { ContentProvider } from "@/lib/content-provider";
import { BmadProject, ParseErrorEntry } from "./types";
import { parseSprintStatus } from "./parse-sprint-status";
import { parseEpics } from "./parse-epics";
import { parseEpicFile } from "./parse-epic-file";
import { parseStory } from "./parse-story";
import { correlate, computeProjectStats } from "./correlate";
import { buildFileTree } from "./utils";
import { resolveBmadOutputDir } from "./parse-config";
import { parseEpicFolderName } from "./parse-epic-folder";
import type { RepoConfig } from "@/lib/types";
import type { ParsedBmadFile, BmadFileMetadata } from "./types";
import { normalizeStoryStatus } from "./utils";
import matter from "gray-matter";
import yaml from "js-yaml";

const PLANNING = "planning-artifacts";
const IMPLEMENTATION = "implementation-artifacts";

/**
 * Parse a full BMAD project using a ContentProvider abstraction.
 * Works with both GitHub repos and local folders.
 */
export async function getBmadProject(
  config: RepoConfig,
  provider: ContentProvider,
): Promise<BmadProject | null> {
  const { owner, name: repo, branch, displayName } = config;

  const initialTree = await provider.getTree();
  const { outputDir, paths: allPaths } = await resolveBmadOutputDir(
    provider,
    initialTree.paths,
  );
  const providerTree = { ...initialTree, paths: allPaths };

  const bmadPaths = allPaths.filter((p) => p.startsWith(outputDir + "/"));

  const sprintStatusPath = bmadPaths.find(
    (p) =>
      p.includes(IMPLEMENTATION) &&
      p.endsWith("sprint-status.yaml")
  );

  // Auto-detect epics source: single file first, then directory fallback.
  // The single file lives directly under planning-artifacts/ — NOT inside
  // a subfolder (otherwise an epic-folder's epic.md would be captured here).
  const epicsPath = bmadPaths.find(
    (p) =>
      p.endsWith("/" + PLANNING + "/epics.md") ||
      p.endsWith("/" + PLANNING + "/epic.md"),
  );

  // All .md files under <outputDir>/.../<PLANNING>/epics/
  const allEpicsDirPaths = bmadPaths.filter(
    (p) => p.includes("/" + PLANNING + "/epics/") && p.endsWith(".md"),
  );

  // Split by depth: flat (epic-1.md) vs nested (epic-1/<file>.md)
  const flatEpicPaths: string[] = [];
  const folderEpicMap = new Map<string, string[]>(); // folderName → contained .md paths
  for (const p of allEpicsDirPaths) {
    const idx = p.indexOf("/" + PLANNING + "/epics/");
    const rel = p.slice(idx + ("/" + PLANNING + "/epics/").length);
    const parts = rel.split("/");
    if (parts.length === 1) {
      if (/^(?:epic[_-]?)?\d+/i.test(parts[0])) flatEpicPaths.push(p);
    } else {
      const folder = parts[0];
      if (!folderEpicMap.has(folder)) folderEpicMap.set(folder, []);
      folderEpicMap.get(folder)!.push(p);
    }
  }

  // Process epic folders → meta path or derived epic, plus inner stories
  interface EpicFolderEntry {
    folder: string;
    id: string;
    title: string;
    metaPath: string | null;
    storyPaths: string[];
  }
  const epicFolders: EpicFolderEntry[] = [];
  const epicIdByStoryPath = new Map<string, string>();

  for (const [folder, paths] of folderEpicMap) {
    const derived = parseEpicFolderName(folder);
    if (!derived) continue;
    const metaPath = paths.find((p) => p.endsWith("/epic.md")) ?? null;
    const innerStories = paths.filter((p) => !p.endsWith("/epic.md"));
    epicFolders.push({
      folder,
      id: derived.id,
      title: derived.title,
      metaPath,
      storyPaths: innerStories,
    });
    for (const sp of innerStories) {
      epicIdByStoryPath.set(sp, derived.id);
    }
  }

  // Epic file paths = flat files + folder meta files (if no single epics.md)
  const epicFilePaths = epicsPath
    ? [] // single epics.md wins — skip directory-based sources
    : [
        ...flatEpicPaths,
        ...epicFolders
          .filter((e) => e.metaPath)
          .map((e) => e.metaPath as string),
      ];

  // Folder-derived epics (no epic.md inside) — used only if no epics.md
  const derivedFolderEpics = epicsPath
    ? []
    : epicFolders.filter((e) => !e.metaPath);

  // Stories: implementation-artifacts (legacy) ∪ epic-folder-inner stories
  const implStoryPaths = bmadPaths.filter((p) => {
    if (!p.includes(IMPLEMENTATION) || !p.endsWith(".md")) return false;
    const filename = p.split("/").pop() || "";
    if (/^\d+-\d+-.+\.md$/.test(filename)) return true;
    if (/^story[_-]?\d/i.test(filename)) return true;
    return false;
  });
  const folderStoryPaths = epicsPath
    ? [] // single-file mode: don't pull stories from epic folders
    : epicFolders.flatMap((e) => e.storyPaths);
  const storyPaths = Array.from(new Set([...implStoryPaths, ...folderStoryPaths]));

  const fetchContent = (path: string) => provider.getFileContent(path);

  const fetches: Promise<{ key: string; content: string }>[] = [];

  if (sprintStatusPath) {
    fetches.push(
      fetchContent(sprintStatusPath).then((content) => ({
        key: "sprint",
        content,
      }))
    );
  }

  if (epicsPath) {
    fetches.push(
      fetchContent(epicsPath).then((content) => ({
        key: "epics",
        content,
      }))
    );
  }

  for (const ep of epicFilePaths) {
    fetches.push(
      fetchContent(ep).then((content) => ({
        key: `epic-file:${ep}`,
        content,
      }))
    );
  }

  for (const sp of storyPaths) {
    fetches.push(
      fetchContent(sp).then((content) => ({
        key: `story:${sp}`,
        content,
      }))
    );
  }

  const results = await Promise.all(fetches);

  const parseErrors: ParseErrorEntry[] = [];
  let totalFiles = 0;

  let sprintStatus = null;
  let epicStatuses: { id: string; status: import("./types").EpicStatus }[] = [];
  let rawEpics: import("./types").Epic[] = [];
  const rawStories: NonNullable<ReturnType<typeof parseStory>>[] = [];

  // Track the parsed epic that came from each folder's epic.md so we can
  // reconcile story epic-ids in case the frontmatter id differs from the
  // folder-derived id.
  const epicByMetaPath = new Map<string, import("./types").Epic>();
  const storyByPath = new Map<
    string,
    NonNullable<ReturnType<typeof parseStory>>
  >();

  // Synthesize epics for folders that have no epic.md inside.
  for (const e of derivedFolderEpics) {
    rawEpics.push({
      id: e.id,
      title: e.title || `Epic ${e.id}`,
      description: "",
      status: "not-started",
      stories: [],
      totalStories: 0,
      completedStories: 0,
      progressPercent: 0,
    });
  }

  for (const { key, content } of results) {
    if (key === "sprint") {
      totalFiles++;
      const parsed = parseSprintStatus(content);
      if (parsed) {
        sprintStatus = parsed.sprintStatus;
        epicStatuses = parsed.epicStatuses;
      } else {
        parseErrors.push({ file: sprintStatusPath!, error: "Failed to parse sprint status YAML. Check the file syntax.", contentType: "sprint-status" });
      }
    } else if (key === "epics") {
      totalFiles++;
      const result = parseEpics(content);
      rawEpics = result.epics;
      if (result.error) {
        parseErrors.push({ file: epicsPath!, error: result.error, contentType: "epic" });
      }
    } else if (key.startsWith("epic-file:")) {
      totalFiles++;
      const filePath = key.replace("epic-file:", "");
      const filename = filePath.split("/").pop() || "";
      const epic = parseEpicFile(content, filename);
      if (epic) {
        rawEpics.push(epic);
        epicByMetaPath.set(filePath, epic);
      } else {
        parseErrors.push({ file: filePath, error: "Failed to parse individual epic file. Check format (frontmatter or heading).", contentType: "epic" });
      }
    } else if (key.startsWith("story:")) {
      totalFiles++;
      const storyPath = key.replace("story:", "");
      const filename = storyPath.split("/").pop() || "";
      const story = parseStory(content, filename);
      if (story) {
        const folderEpicId = epicIdByStoryPath.get(storyPath);
        if (folderEpicId) {
          // Story lives inside epic-N/ — fix epicId and (re)build composite id
          story.epicId = folderEpicId;
          if (!story.id.includes(".")) {
            story.id = `${folderEpicId}.${story.id}`;
          }
        }
        rawStories.push(story);
        storyByPath.set(storyPath, story);
      } else {
        parseErrors.push({ file: storyPath, error: "Failed to parse story. Check the markdown format and section structure.", contentType: "story" });
      }
    }
  }

  // Reconcile epic id when epic.md frontmatter declared a different id than
  // the folder name implied. Stories were tagged with the folder-derived id;
  // rewrite them to the canonical id from the parsed epic.
  for (const ef of epicFolders) {
    if (!ef.metaPath) continue;
    const parsedEpic = epicByMetaPath.get(ef.metaPath);
    if (!parsedEpic || parsedEpic.id === ef.id) continue;

    const oldPrefix = ef.id + ".";
    const newPrefix = parsedEpic.id + ".";
    for (const sp of ef.storyPaths) {
      const story = storyByPath.get(sp);
      if (!story) continue;
      story.epicId = parsedEpic.id;
      if (story.id.startsWith(oldPrefix)) {
        story.id = newPrefix + story.id.slice(oldPrefix.length);
      }
    }
  }

  const successfulFiles = totalFiles - parseErrors.length;

  if (parseErrors.length > 0) {
    console.warn(`[BMAD Parse] ${owner}/${repo}: ${parseErrors.length} parsing errors out of ${totalFiles} files`);
  }

  const correlated = correlate(sprintStatus, rawEpics, rawStories, epicStatuses);
  const epics = [...correlated.epics].sort(
    (a, b) => (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0),
  );
  const stories = correlated.stories;
  const storyPathSet = new Set(storyPaths);
  const docPaths = bmadPaths.filter((p) => !storyPathSet.has(p));
  const fileTree = buildFileTree(docPaths, outputDir);

  // Detect a "Docs" folder (case-insensitive) via rootDirectories (F20)
  const docsFolderName = providerTree.rootDirectories.find(
    (d) => d.toLowerCase() === "docs"
  ) ?? null;
  const docsTree = docsFolderName
    ? buildFileTree(
        allPaths.filter((p) => p.startsWith(docsFolderName + "/")),
        docsFolderName
      )
    : [];

  const stats = computeProjectStats({
    owner,
    repo,
    branch,
    displayName,
    sprintStatus,
    epics,
    stories,
    fileTree,
    bmadFiles: bmadPaths,
    docsTree,
    docsFolderName,
  });

  return {
    owner,
    repo,
    branch,
    displayName,
    sprintStatus,
    epics,
    stories,
    fileTree,
    bmadFiles: bmadPaths,
    docsTree,
    docsFolderName,
    parseHealth: {
      errors: parseErrors,
      totalFiles,
      successfulFiles,
    },
    ...stats,
  };
}

function normalizeStatus(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return normalizeStoryStatus(raw);
}

function extractMetadata(
  data: Record<string, unknown> | null | undefined,
): BmadFileMetadata | null {
  if (!data || typeof data !== "object") return null;

  const status = normalizeStatus(
    typeof data.status === "string" ? data.status : undefined,
  );
  const stepsCompleted = Array.isArray(data.stepsCompleted)
    ? data.stepsCompleted.map(String)
    : Array.isArray(data.steps_completed)
      ? data.steps_completed.map(String)
      : undefined;
  const lastStep =
    typeof data.lastStep === "string" || typeof data.lastStep === "number"
      ? data.lastStep
      : typeof data.last_step === "string" || typeof data.last_step === "number"
        ? data.last_step
        : undefined;
  const title = typeof data.title === "string" ? data.title : undefined;
  const completedAt =
    typeof data.completedAt === "string"
      ? data.completedAt
      : typeof data.completed_at === "string"
        ? data.completed_at
        : undefined;
  const workflowType =
    typeof data.workflowType === "string"
      ? data.workflowType
      : typeof data.workflow_type === "string"
        ? data.workflow_type
        : undefined;

  const hasAny =
    status ||
    stepsCompleted ||
    lastStep !== undefined ||
    title ||
    completedAt ||
    workflowType;

  if (!hasAny) return null;

  return {
    status,
    stepsCompleted,
    lastStep,
    title,
    completedAt,
    workflowType,
  };
}

/**
 * Parse a BMAD file based on its content type.
 * Pure function — no network calls, no side effects.
 */
export function parseBmadFile(
  content: string,
  contentType: "markdown" | "yaml" | "json" | "text",
): ParsedBmadFile {
  try {
    switch (contentType) {
      case "markdown": {
        const { data, content: body } = matter(content);
        const frontmatter =
          data && Object.keys(data).length > 0 ? data : null;
        return {
          contentType,
          frontmatter,
          metadata: extractMetadata(frontmatter),
          body,
          rawContent: content,
          parseError: null,
        };
      }
      case "yaml": {
        const parsed = yaml.load(content);
        const data =
          parsed && typeof parsed === "object"
            ? (parsed as Record<string, unknown>)
            : null;
        return {
          contentType,
          frontmatter: null,
          metadata: extractMetadata(data),
          body: content,
          rawContent: content,
          parseError: null,
        };
      }
      case "json": {
        const parsed = JSON.parse(content);
        return {
          contentType,
          frontmatter: null,
          metadata: null,
          body: JSON.stringify(parsed, null, 2),
          rawContent: content,
          parseError: null,
        };
      }
      case "text":
      default:
        return {
          contentType,
          frontmatter: null,
          metadata: null,
          body: content,
          rawContent: content,
          parseError: null,
        };
    }
  } catch (e) {
    return {
      contentType,
      frontmatter: null,
      metadata: null,
      body: content,
      rawContent: content,
      parseError: e instanceof Error ? e.message : "Parsing error",
    };
  }
}
