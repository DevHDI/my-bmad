import { BmadProject, Epic, SprintStatus, StoryDetail, EpicStatus } from "./types";

/**
 * Convert a sprint-status slug like "1-1-project-initialization" into
 * a human-readable title: "Project Initialization".
 */
function formatStoryTitle(slug: string): string {
  // Remove the leading "N-N-" prefix
  const withoutPrefix = slug.replace(/^\d+-\d+-/, "");
  if (!withoutPrefix || withoutPrefix === slug) return slug;
  return withoutPrefix
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function correlate(
  sprintStatus: SprintStatus | null,
  epics: Epic[],
  stories: StoryDetail[],
  epicStatuses?: { id: string; status: EpicStatus }[]
): { epics: Epic[]; stories: StoryDetail[] } {
  // Work on copies to avoid mutating the input arrays/objects
  let mutableStories = stories.map((s) => ({ ...s }));
  const storyMap = new Map<string, StoryDetail>();
  for (const s of mutableStories) {
    storyMap.set(s.id, s);
  }

  // Story status priority: markdown frontmatter / "Status:" line wins.
  // sprint-status.yaml is only used as a fallback when the story markdown
  // declared no explicit status (statusExplicit !== true), and to populate
  // stubs for stories that exist only in sprint-status.
  if (sprintStatus) {
    for (const entry of sprintStatus.stories) {
      const story = storyMap.get(entry.id);
      if (story) {
        if (story.statusExplicit !== true && entry.status !== "unknown") {
          story.status = entry.status;
        }
        if (!story.epicId && entry.epicId) {
          story.epicId = entry.epicId;
        }
      } else {
        // Create a stub StoryDetail from the sprint entry
        const stub: StoryDetail = {
          id: entry.id,
          title: formatStoryTitle(entry.title),
          status: entry.status,
          epicId: entry.epicId || "",
          description: "",
          acceptanceCriteria: [],
          tasks: [],
          completedTasks: 0,
          totalTasks: 0,
        };
        mutableStories = [...mutableStories, stub];
        storyMap.set(entry.id, stub);
      }
    }
  }

  // Build a map of epic statuses from sprint-status.yaml
  const epicStatusMap = new Map<string, EpicStatus>();
  if (epicStatuses) {
    for (const es of epicStatuses) {
      epicStatusMap.set(es.id, es.status);
    }
  }

  const enrichedEpics = epics.map((epic) => {
    const epicStories = mutableStories.filter(
      (s) => s.epicId === epic.id || epic.stories.includes(s.id)
    );
    const completed = epicStories.filter((s) => s.status === "done").length;
    const total = epicStories.length;

    // Epic status priority: derive from the epic's stories first.
    // sprint-status.yaml epic-level is only used as fallback when the epic
    // has no stories at all (so we have no signal otherwise).
    let status: EpicStatus;
    if (total > 0) {
      if (completed === total) {
        status = "done";
      } else if (
        completed > 0 ||
        epicStories.some((s) => s.status === "in-progress")
      ) {
        status = "in-progress";
      } else {
        status = "not-started";
      }
    } else {
      status = epicStatusMap.get(epic.id) || "not-started";
    }

    return {
      ...epic,
      status,
      totalStories: total,
      completedStories: completed,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const resultStories = mutableStories.map((story) => {
    if (story.epicId) {
      const epic = enrichedEpics.find((e) => e.id === story.epicId);
      if (epic) {
        return { ...story, epicTitle: epic.title };
      }
    }
    return story;
  });

  return { epics: enrichedEpics, stories: resultStories };
}

export function computeProjectStats(project: Omit<BmadProject, "totalStories" | "completedStories" | "inProgressStories" | "progressPercent">): {
  totalStories: number;
  completedStories: number;
  inProgressStories: number;
  progressPercent: number;
} {
  const sprintTotal = project.sprintStatus?.stories.length ?? 0;
  const total = Math.max(project.stories.length, sprintTotal);
  const completed = project.stories.filter((s) => s.status === "done").length;
  const inProgress = project.stories.filter((s) => s.status === "in-progress").length;

  return {
    totalStories: total,
    completedStories: completed,
    inProgressStories: inProgress,
    progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
