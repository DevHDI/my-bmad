import {
  createUserOctokit,
  getCachedUserRepoTree,
  getCachedUserRawContent,
} from "../github/client";
import { BmadProject, ParseErrorEntry } from "./types";
import { parseSprintStatus } from "./parse-sprint-status";
import { parseEpics } from "./parse-epics";
import { parseStory } from "./parse-story";
import { correlate, computeProjectStats } from "./correlate";
import { buildFileTree } from "./utils";
import type { RepoConfig } from "@/lib/types";
import type { ParsedBmadFile, BmadFileMetadata } from "./types";
import { normalizeStoryStatus } from "./utils";
import matter from "gray-matter";
import yaml from "js-yaml";

const BMAD_OUTPUT = "_bmad-output";
const PLANNING = "planning-artifacts";
const IMPLEMENTATION = "implementation-artifacts";

/**
 * Parse a full BMAD project from a GitHub repo.
 * When accessToken and userId are provided, uses authenticated Octokit with
 * per-user caching. Falls back to PAT-based legacy functions otherwise.
 */
export async function getBmadProject(
  config: RepoConfig,
  accessToken?: string,
  userId?: string,
): Promise<BmadProject | null> {
  const { owner, name: repo, branch, displayName } = config;

  if (!accessToken || !userId) {
    console.error(`[getBmadProject] Missing accessToken or userId for ${owner}/${repo}`);
    return null;
  }

  const octokit = createUserOctokit(accessToken);

  const tree = await getCachedUserRepoTree(octokit, userId, owner, repo, branch);

  const allPaths = tree.tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path);

  const bmadPaths = allPaths.filter((p) => p.startsWith(BMAD_OUTPUT + "/"));

  const sprintStatusPath = bmadPaths.find(
    (p) =>
      p.includes(IMPLEMENTATION) &&
      p.endsWith("sprint-status.yaml")
  );

  const epicsPath = bmadPaths.find(
    (p) =>
      p.includes(PLANNING) &&
      (p.endsWith("epics.md") || p.endsWith("epic.md"))
  );

  const storyPaths = bmadPaths.filter((p) => {
    if (!p.includes(IMPLEMENTATION) || !p.endsWith(".md")) return false;
    const filename = p.split("/").pop() || "";
    // Match "N-N-title.md" pattern (e.g., "1-1-project-initialization.md")
    if (/^\d+-\d+-.+\.md$/.test(filename)) return true;
    // Also match legacy "story-N.md" / "story_N.md" pattern
    if (/^story[_-]?\d/i.test(filename)) return true;
    return false;
  });

  const fetchContent = (path: string) =>
    getCachedUserRawContent(octokit, userId, owner, repo, branch, path);

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
    } else if (key.startsWith("story:")) {
      totalFiles++;
      const storyPath = key.replace("story:", "");
      const filename = storyPath.split("/").pop() || "";
      const story = parseStory(content, filename);
      if (story) {
        rawStories.push(story);
      } else {
        parseErrors.push({ file: storyPath, error: "Failed to parse story. Check the markdown format and section structure.", contentType: "story" });
      }
    }
  }

  const successfulFiles = totalFiles - parseErrors.length;

  if (parseErrors.length > 0) {
    console.warn(`[BMAD Parse] ${owner}/${repo}: ${parseErrors.length} parsing errors out of ${totalFiles} files`);
  }

  const { epics, stories } = correlate(sprintStatus, rawEpics, rawStories, epicStatuses);
  const storyPathSet = new Set(storyPaths);
  const docPaths = bmadPaths.filter((p) => !storyPathSet.has(p));
  const fileTree = buildFileTree(docPaths, BMAD_OUTPUT);

  // Detect a "Docs" folder (case-insensitive) at the repo root
  const docsFolder = tree.tree.find(
    (item) =>
      item.type === "tree" &&
      !item.path.includes("/") &&
      item.path.toLowerCase() === "docs"
  );
  const docsFolderName = docsFolder?.path ?? null;
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
