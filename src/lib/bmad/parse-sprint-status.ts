import yaml from "js-yaml";
import { SprintStatus, SprintStoryEntry, EpicStatus } from "./types";
import { normalizeStoryStatus, normalizeAlphanumericId } from "./utils";

function normalizeEpicStatus(raw: string | undefined): EpicStatus {
  if (!raw) return "not-started";
  const s = raw.toLowerCase().trim();
  if (s === "done" || s === "complete" || s === "completed") return "done";
  if (s.includes("progress") || s === "started") return "in-progress";
  return "not-started";
}

export interface SprintEpicEntry {
  id: string;
  status: EpicStatus;
}

export interface ParsedSprintData {
  sprintStatus: SprintStatus;
  epicStatuses: SprintEpicEntry[];
}

export function parseSprintStatus(content: string): ParsedSprintData | null {
  try {
    const data = yaml.load(content) as Record<string, unknown>;
    if (!data || typeof data !== "object") return null;

    const stories: SprintStoryEntry[] = [];
    const epicStatuses: SprintEpicEntry[] = [];

    // Handle "development_status" map format (costingo style):
    // development_status:
    //   epic-1: done
    //   1-1-project-initialization: done
    const devStatus = data.development_status as Record<string, string> | undefined;
    if (devStatus && typeof devStatus === "object") {
      for (const [key, value] of Object.entries(devStatus)) {
        const statusStr = String(value);

        // Retrospective entries: skip (before epicMatch to catch epic-N-retrospective keys)
        if (key.includes("retrospective")) continue;

        // Epic entries: "epic-N: status" or "epic-devops-infra: status"
        const epicMatch = key.match(/^epic-(\d+|[a-z][a-z0-9_-]*)$/i);
        if (epicMatch) {
          const rawId = epicMatch[1];
          const id = /^\d+$/.test(rawId) ? rawId : normalizeAlphanumericId(rawId);
          epicStatuses.push({
            id,
            status: normalizeEpicStatus(statusStr),
          });
          continue;
        }

        // Story entries: "N-N-title: status" (numeric) or "di-1-title: status" (alpha prefix)
        const numericStory = key.match(/^(\d+)-(\d+)-(.+)$/);
        const alphaStory = !numericStory
          ? key.match(/^([a-z][a-z0-9_-]*?)-(\d+)-(.+)$/i)
          : null;
        const storyMatch = numericStory ?? alphaStory;
        if (storyMatch) {
          const rawEpicId = storyMatch[1];
          const epicId = /^\d+$/.test(rawEpicId)
            ? rawEpicId
            : normalizeAlphanumericId(rawEpicId);
          const storyNum = storyMatch[2];
          const id = `${epicId}.${storyNum}`;
          stories.push({
            id,
            title: key,
            status: normalizeStoryStatus(statusStr),
            epicId,
          });
          continue;
        }
      }
    }

    // Also handle legacy array format
    const rawStories = (data.stories || data.story_status || data.items) as
      | Record<string, unknown>[]
      | undefined;
    if (Array.isArray(rawStories)) {
      for (const s of rawStories) {
        if (typeof s === "object" && s !== null) {
          stories.push({
            id: String(s.id || s.story_id || s.name || ""),
            title: String(s.title || s.name || s.id || ""),
            status: normalizeStoryStatus(String(s.status || "")),
            epicId: s.epic_id ? String(s.epic_id) : s.epic ? String(s.epic) : undefined,
          });
        }
      }
    }

    const sprintStatus: SprintStatus = {
      sprint: data.sprint ? String(data.sprint) : data.project ? String(data.project) : undefined,
      status: data.status ? String(data.status) : undefined,
      startDate: data.start_date ? String(data.start_date) : data.generated ? String(data.generated) : undefined,
      endDate: data.end_date ? String(data.end_date) : undefined,
      stories,
    };

    return { sprintStatus, epicStatuses };
  } catch (e) {
    console.error("Failed to parse sprint status YAML:", e);
    return null;
  }
}
