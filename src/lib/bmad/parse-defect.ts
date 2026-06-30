import matter from "gray-matter";
import type { Defect, DefectStatus, DefectSeverity } from "./types";
import { normalizeAlphanumericId } from "./utils";

function normalizeDefectStatus(raw: string | undefined): DefectStatus {
  if (!raw) return "open";
  const s = raw.toLowerCase().trim();
  if (s === "open" || s === "new") return "open";
  if (s.includes("progress") || s === "started") return "in-progress";
  if (s === "resolved" || s === "fixed") return "resolved";
  if (s === "closed" || s === "done" || s === "complete" || s === "completed") return "closed";
  // Story-style statuses map to their closest defect equivalent
  if (s === "ready-for-dev" || s === "ready" || s === "backlog") return "open";
  if (s === "review") return "in-progress";
  if (s === "blocked") return "open";
  return "open";
}

function normalizeDefectSeverity(raw: string | undefined): DefectSeverity {
  if (!raw) return "medium";
  const s = raw.toLowerCase().trim();
  if (s === "critical" || s === "crit" || s === "p0") return "critical";
  if (s === "high" || s === "h" || s === "p1" || s === "major") return "high";
  if (s === "medium" || s === "med" || s === "m" || s === "p2" || s === "moderate") return "medium";
  if (s === "low" || s === "l" || s === "p3" || s === "minor" || s === "trivial") return "low";
  return "medium";
}

/**
 * Extract a field value from bold inline notation: **Field:** value
 * Handles both "**Field:** value" (colon inside bold) and "**Field**: value".
 */
function extractBoldField(body: string, field: string): string | undefined {
  // Match "**Field:** value" (colon inside bold markers) or "**Field**: value"
  const re = new RegExp(`\\*\\*${field}:?\\*\\*:?\\s*(.+)`, "im");
  return body.match(re)?.[1]?.split(/\s*\(/)[0]?.trim();
}

export function parseDefect(content: string, filename: string): Defect | null {
  try {
    const hasFrontmatter = content.trimStart().startsWith("---");
    let body: string;
    let fm: Record<string, unknown> = {};

    if (hasFrontmatter) {
      const parsed = matter(content);
      body = parsed.content;
      fm = parsed.data;
    } else {
      body = content;
    }

    // --- ID ---
    // 1. Frontmatter `id:`
    // 2. Heading: "# Defect DF.1: Title" or "# Defect 1: Title"
    // 3. Filename: df-1-*.md → "df.1", defect-1-*.md → "defect-1"
    let id: string = fm.id ? String(fm.id) : "";
    if (!id) {
      const headingMatch = body.match(/^#\s+Defect\s+([\w.-]+)\s*:/im);
      if (headingMatch) {
        const raw = headingMatch[1]; // e.g. "DF.1"
        id = /[A-Za-z]/.test(raw) ? raw.toLowerCase() : raw;
      }
    }
    if (!id) {
      const nameWithoutExt = filename.replace(/\.md$/i, "");
      // df-1-title → df.1
      const dfMatch = nameWithoutExt.match(/^(df|defect|bug)[_-](\d+)/i);
      if (dfMatch) {
        id = `${dfMatch[1].toLowerCase()}.${dfMatch[2]}`;
      } else {
        id = nameWithoutExt;
      }
    }

    // --- Title ---
    let title: string = fm.title ? String(fm.title) : "";
    if (!title) {
      // "# Defect DF.1: Title text" or "# Title text"
      const headingMatch = body.match(/^#\s+(?:Defect\s+[\w.-]+\s*:\s*)?(.+)/m);
      title = headingMatch?.[1]?.trim() || id;
    }

    // --- Status ---
    const rawStatus =
      fm.status ? String(fm.status) :
      extractBoldField(body, "Status") ??
      body.match(/^Status:\s*(.+)/im)?.[1]?.trim();
    const status = normalizeDefectStatus(rawStatus);

    // --- Severity ---
    const rawSeverity =
      fm.severity ? String(fm.severity) :
      extractBoldField(body, "Severity") ??
      body.match(/^Severity:\s*(.+)/im)?.[1]?.trim();
    const severity = normalizeDefectSeverity(rawSeverity);

    // --- Story ID (optional) ---
    const rawStoryId =
      fm.story_id ? String(fm.story_id) :
      fm.storyId ? String(fm.storyId) :
      fm.story ? String(fm.story) :
      extractBoldField(body, "Story(?:\\s+ID)?") ??
      body.match(/^Story(?:\s+ID)?:\s*(.+)/im)?.[1]?.trim() ??
      "";
    const storyId = rawStoryId.replace(/^[Ss]tory[\s-]*/i, "").trim();

    // --- Epic ID ---
    // Prefer explicit frontmatter, then derive from defect ID prefix (e.g. "df.1" → "df")
    const rawEpicId =
      fm.epic_id ? String(fm.epic_id) :
      fm.epicId ? String(fm.epicId) :
      undefined;
    const epicId = rawEpicId
      ? normalizeAlphanumericId(rawEpicId)
      : storyId && storyId.includes(".")
        ? storyId.split(".")[0]
        : id.includes(".")
          ? id.split(".")[0]
          : undefined;

    // --- Description ---
    // Prefer "## Defect Summary" then "## Description"
    const summaryMatch = body.match(/##\s+Defect\s+Summary\s*\n([\s\S]*?)(?=\n##|\n$|$)/i);
    const descMatch = summaryMatch ?? body.match(/##\s+Description\s*\n([\s\S]*?)(?=\n##|\n$|$)/i);
    const description = descMatch ? descMatch[1].trim().slice(0, 1000) : body.trim().slice(0, 500);

    // --- Steps to Reproduce ---
    const stepsToReproduce: string[] = [];
    const stepsMatch = body.match(/##\s+Steps\s+to\s+Reproduce\s*\n([\s\S]*?)(?=\n##|\n$|$)/i);
    if (stepsMatch) {
      const items = stepsMatch[1].match(/(?:^|\n)\s*(?:\d+\.\s+|[-*]\s+)(.+)/g);
      if (items) {
        for (const item of items) {
          stepsToReproduce.push(item.replace(/^\s*(?:\d+\.\s+|[-*]\s+)/, "").trim());
        }
      }
    }

    return { id, title, status, severity, storyId, epicId, description, stepsToReproduce };
  } catch (e) {
    console.error(`Failed to parse defect ${filename}:`, e);
    return null;
  }
}
