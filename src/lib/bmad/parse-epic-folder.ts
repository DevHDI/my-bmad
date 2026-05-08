export interface EpicFolderName {
  id: string;
  title: string;
}

/**
 * Derive an epic id and (optional) title from a folder name when no
 * `epic.md` file is present inside the folder.
 *
 * Recognized patterns:
 *   epic-1                       → { id: "1", title: "" }
 *   epic_1                       → { id: "1", title: "" }
 *   1                            → { id: "1", title: "" }
 *   epic-1-project-foundation    → { id: "1", title: "Project Foundation" }
 *   epic_1_project_foundation    → { id: "1", title: "Project Foundation" }
 *   1-project-foundation         → { id: "1", title: "Project Foundation" }
 */
export function parseEpicFolderName(folderName: string): EpicFolderName | null {
  const trimmed = folderName.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(?:epic[_-]?)?(\d+)(?:[_-]+(.+))?$/i);
  if (!match) return null;

  const id = match[1];
  const slug = match[2] ?? "";

  const title = slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return { id, title };
}
