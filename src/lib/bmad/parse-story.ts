import matter from "gray-matter";
import { StoryDetail, StoryTask } from "./types";
import { normalizeStoryStatus } from "./utils";

export function parseStory(
  content: string,
  filename: string
): StoryDetail | null {
  try {
    // Try to extract ID from filename first
    // Pattern: "N-N-title.md" (e.g., "1-1-project-initialization.md")
    const numericMatch = filename.match(/^(\d+)-(\d+)-/);
    // Legacy pattern: "story-N.md" or "story_N.md"
    const legacyMatch = filename.match(/story[_-]?(\d+(?:[._-]\d+)?)/i);

    let id: string;
    let epicId: string;

    if (numericMatch) {
      id = `${numericMatch[1]}.${numericMatch[2]}`;
      epicId = numericMatch[1];
    } else if (legacyMatch) {
      id = legacyMatch[1].replace(/[._]/, ".");
      epicId = id.includes(".") ? id.split(".")[0] : "";
    } else {
      id = filename.replace(/\.md$/i, "");
      epicId = "";
    }

    // Check if content has frontmatter
    const hasFrontmatter = content.trimStart().startsWith("---");
    let body: string;
    let frontmatterStatus: string | undefined;
    let frontmatterTitle: string | undefined;
    let frontmatterEpicId: string | undefined;

    if (hasFrontmatter) {
      const parsed = matter(content);
      body = parsed.content;
      frontmatterStatus = parsed.data.status || parsed.data.state;
      frontmatterTitle = parsed.data.title;
      frontmatterEpicId = parsed.data.epic_id
        ? String(parsed.data.epic_id)
        : parsed.data.epic
          ? String(parsed.data.epic)
          : undefined;
      if (parsed.data.id) id = String(parsed.data.id);
      if (frontmatterEpicId) epicId = frontmatterEpicId;
    } else {
      body = content;
    }

    // Extract title from heading: "# Story 1.1: Title" or "# Title"
    const titleMatch = body.match(/^#\s+(?:Story\s+[\d.]+[:\s]+)?(.+)/m);
    const title = frontmatterTitle || titleMatch?.[1]?.trim() || `Story ${id}`;

    // Extract status from "Status: done" line (plain text, not frontmatter)
    const statusLineMatch = body.match(/^Status:\s*(.+)/im);
    const status = normalizeStoryStatus(
      frontmatterStatus || statusLineMatch?.[1]?.trim()
    );

    // Extract acceptance criteria
    const acceptanceCriteria: string[] = [];
    const acSection = body.match(
      /## Acceptance Criteria\s*\n([\s\S]*?)(?=\n##|\n$|$)/i
    );
    if (acSection) {
      // Match numbered items (1. ..., 2. ...) and bullet items (- ..., * ...)
      const items = acSection[1].match(/(?:^|\n)\s*(?:\d+\.\s+|\*\*(?:Given|And|Then)\*\*|[-*]\s+)(.+)/g);
      if (items) {
        for (const item of items) {
          acceptanceCriteria.push(item.replace(/^\s*(?:\d+\.\s+|[-*]\s+)/, "").trim());
        }
      }
    }

    // Extract tasks from checkboxes
    const tasks: StoryTask[] = [];
    const taskMatches = body.matchAll(/- \[([ xX])\]\s+(.+)/g);
    for (const m of taskMatches) {
      tasks.push({
        completed: m[1].toLowerCase() === "x",
        description: m[2].trim(),
      });
    }

    return {
      id,
      title: String(title),
      status,
      epicId,
      description: body.trim().slice(0, 1000),
      acceptanceCriteria,
      tasks,
      completedTasks: tasks.filter((t) => t.completed).length,
      totalTasks: tasks.length,
    };
  } catch (e) {
    console.error(`Failed to parse story ${filename}:`, e);
    return null;
  }
}
