import { Epic, EpicStatus } from "./types";
import matter from "gray-matter";
import { normalizeAlphanumericId } from "./utils";

/**
 * Parse a single epic from an individual markdown file.
 * Supports two formats:
 *
 * 1. Frontmatter-based:
 *    ---
 *    id: 1
 *    title: Project Setup
 *    ---
 *    Description and story references...
 *
 * 2. Heading-based (same as epics.md format but for a single epic):
 *    ## Epic 1: Project Setup
 *    Description and story references...
 *
 * Falls back to extracting id from filename (e.g., epic-1.md → id "1").
 */
export function parseEpicFile(
  content: string,
  filename: string,
): Epic | null {
  try {
    const { data: fm, content: body } = matter(content);

    const id = extractId(fm, body, filename);
    if (!id) return null;

    const title = extractTitle(fm, body, id);
    const storyIds = extractStoryReferences(body);
    const description = extractDescription(body).slice(0, 500);

    return {
      id,
      title,
      description,
      status: "not-started" as EpicStatus,
      stories: storyIds,
      totalStories: storyIds.length,
      completedStories: 0,
      progressPercent: 0,
    };
  } catch {
    return null;
  }
}

function extractId(
  fm: Record<string, unknown>,
  body: string,
  filename: string,
): string | null {
  // 1. From frontmatter
  if (fm.id !== undefined && fm.id !== null) {
    return String(fm.id);
  }

  // 2. From heading: "## Epic 1: Title", "## 1 - Title", or "## Epic DevOps/Infra: Title"
  const numericHeading = body.match(/^##\s+(?:Epic\s+)?(\d+)[\s:.—-]/im);
  if (numericHeading) return numericHeading[1];
  const alphaHeading = body.match(/^##\s+Epic\s+([A-Za-z][A-Za-z0-9_/-]*)[\s:.—-]/im);
  if (alphaHeading) return normalizeAlphanumericId(alphaHeading[1]);

  // 3. From filename: epic-1.md, epic_1.md, 1-title.md, 1.md, epic-di.md, epic-devops-infra.md
  const nameWithoutExt = filename.replace(/\.md$/i, "");
  const numericFile = nameWithoutExt.match(/^(?:epic[_-]?)?(\d+)(?:[_-]|$)/i);
  if (numericFile) return numericFile[1];
  // Alpha requires explicit "epic-" prefix to avoid false positives (e.g. "readme.md")
  const alphaFile = nameWithoutExt.match(/^epic[_-]([a-z][a-z0-9_-]*)$/i);
  if (alphaFile) return normalizeAlphanumericId(alphaFile[1]);

  return null;
}

function extractTitle(
  fm: Record<string, unknown>,
  body: string,
  id: string,
): string {
  // 1. From frontmatter
  if (typeof fm.title === "string" && fm.title.trim()) {
    return fm.title.trim();
  }

  // 2. From heading
  const headingMatch = body.match(
    /^##\s+(?:Epic\s+)?(?:\d+|[A-Za-z][A-Za-z0-9_/-]*)[\s:.—-]+(.+)/im,
  );
  if (headingMatch) return headingMatch[1].trim();

  // 3. From H1 heading: # Title
  const h1Match = body.match(/^#\s+(.+)/m);
  if (h1Match) {
    const h1 = h1Match[1].trim();
    // Strip "Epic N:" or "Epic DevOps/Infra:" prefix if present
    const stripped = h1.replace(
      /^(?:Epic\s+(?:\d+|[A-Za-z][A-Za-z0-9_/-]*)|(?:Epic\s+)?\d+)[\s:.—-]+/i,
      ""
    ).trim();
    return stripped || h1;
  }

  return `Epic ${id}`;
}

function extractStoryReferences(body: string): string[] {
  const ids: string[] = [];
  const matches = body.matchAll(
    /(?:story|S)[\s-]*((?:\d+(?:\.\d+)?)|(?:[A-Za-z][A-Za-z0-9_-]*\.\d+))/gi
  );
  for (const m of matches) {
    const raw = m[1];
    const id = /[A-Za-z]/.test(raw) ? raw.toLowerCase() : raw;
    if (id && !ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
}

function extractDescription(body: string): string {
  const lines = body.split("\n");
  const descLines: string[] = [];

  for (const line of lines) {
    // Skip headings
    if (line.startsWith("#")) continue;
    if (line.trim()) {
      descLines.push(line);
    }
  }

  return descLines.join("\n").trim();
}
