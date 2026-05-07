import { Epic, FileTreeNode, StoryStatus } from "./types";

/**
 * Canonical normalizeStoryStatus used across all BMAD parsers.
 * Default fallback is "backlog".
 */
export function normalizeStoryStatus(raw: string | undefined): StoryStatus {
  if (!raw) return "backlog";
  const s = raw.toLowerCase().trim();
  if (s === "done" || s === "complete" || s === "completed") return "done";
  if (s.includes("progress") || s === "started") return "in-progress";
  if (s === "review" || s.includes("review")) return "review";
  if (s === "blocked") return "blocked";
  if (s === "ready-for-dev" || s === "ready") return "ready-for-dev";
  if (s === "backlog" || s === "todo" || s === "pending") return "backlog";
  if (s === "optional") return "backlog";
  return "backlog";
}

/**
 * Returns a short, visual-friendly ID for an Epic (e.g., "DI", "HK", "1").
 */
export function getEpicShortId(epic: Epic): string {
  // If numeric ID, return as is
  if (/^\d+$/.test(epic.id)) return epic.id;

  // Try to get prefix from first story (e.g., "di.1" -> "DI")
  if (epic.stories && epic.stories.length > 0) {
    const firstStoryId = epic.stories[0];
    const parts = firstStoryId.split(".");
    if (parts.length > 1 && parts[0].length <= 4) {
      return parts[0].toUpperCase();
    }
  }

  // Fallback: first 2 characters of the ID in uppercase
  return epic.id.slice(0, 2).toUpperCase();
}

/**
 * Returns a short, visual-friendly ID for a Story (e.g., "1", "2").
 * Typically used when the Epic context is already clear.
 */
export function getStoryShortId(storyId: string, index?: number): string {
  const parts = storyId.split(".");
  if (parts.length > 1) {
    // If it's like "1.1", "DI.1", or "HKP.1.2", return everything after the first dot
    return parts.slice(1).join(".");
  }
  return index !== undefined ? String(index + 1) : storyId;
}

export function buildFileTree(paths: string[], basePath: string): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  const filtered = paths
    .filter((p) => p.startsWith(basePath))
    .map((p) => p.slice(basePath.length).replace(/^\//, ""));

  for (const relativePath of filtered) {
    const parts = relativePath.split("/");
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const fullPath = basePath + "/" + parts.slice(0, i + 1).join("/");

      let existing = currentLevel.find((n) => n.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: fullPath,
          type: isFile ? "file" : "directory",
          children: isFile ? undefined : [],
        };
        currentLevel.push(existing);
      }

      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    }
  }

  return sortTree(root);
}

function sortTree(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((n) => ({
      ...n,
      children: n.children ? sortTree(n.children) : undefined,
    }));
}

export function normalizeStoryId(raw: string): string {
  return raw
    .replace(/^(?:story|S)[_-]?/i, "")
    .replace(/[._]/, ".")
    .trim();
}

export function normalizeAlphanumericId(raw: string): string {
  return raw.toLowerCase().replace(/\//g, "-");
}
