import { Epic, EpicStatus } from "./types";
import { normalizeAlphanumericId } from "./utils";

export function parseEpics(content: string): { epics: Epic[]; error?: string } {
  try {
    const epics: Epic[] = [];
    const lines = content.split("\n");

    let currentEpic: Partial<Epic> | null = null;
    let descLines: string[] = [];
    let storyIds: string[] = [];

    for (const line of lines) {
      const epicMatch = line.match(
        /^##\s+(?:(?:Epic\s+)?(\d+)|Epic\s+([A-Za-z][A-Za-z0-9_/-]*))[\s:.—-]+(.+)/i
      );
      if (epicMatch) {
        if (currentEpic && currentEpic.id) {
          epics.push(finalizeEpic(currentEpic, descLines, storyIds));
        }
        const rawId = epicMatch[1] ?? epicMatch[2];
        currentEpic = {
          id: epicMatch[1] ? rawId : normalizeAlphanumericId(rawId),
          title: epicMatch[3].trim(),
        };
        descLines = [];
        storyIds = [];
        continue;
      }

      if (currentEpic) {
        const storyRef = line.matchAll(
          /(?:story|S)[\s-]*((?:\d+(?:\.\d+)?)|(?:[A-Za-z][A-Za-z0-9_-]*\.\d+(?:\.\d+)?))/gi
        );
        for (const match of storyRef) {
          const raw = match[1];
          const id = /[A-Za-z]/.test(raw) ? raw.toLowerCase() : raw;
          if (id && !storyIds.includes(id)) {
            storyIds.push(id);
          }
        }

        if (line.trim() && !line.startsWith("#")) {
          descLines.push(line);
        }
      }
    }

    if (currentEpic && currentEpic.id) {
      epics.push(finalizeEpic(currentEpic, descLines, storyIds));
    }

    return { epics };
  } catch (e) {
    console.error("[BMAD Parse] parseEpics failed:", e);
    return { epics: [], error: e instanceof Error ? e.message : "Unknown error parsing epics" };
  }
}

function finalizeEpic(
  partial: Partial<Epic>,
  descLines: string[],
  storyIds: string[]
): Epic {
  return {
    id: partial.id || "0",
    title: partial.title || "Untitled Epic",
    description: descLines.join("\n").trim().slice(0, 500),
    status: "not-started" as EpicStatus,
    stories: storyIds,
    totalStories: storyIds.length,
    completedStories: 0,
    progressPercent: 0,
  };
}
