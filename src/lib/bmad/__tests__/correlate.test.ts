import { describe, it, expect } from "vitest";
import { correlate } from "../correlate";
import type { StoryDetail, Epic, SprintStatus } from "../types";

function makeStory(overrides: Partial<StoryDetail> = {}): StoryDetail {
  return {
    id: "1.1",
    title: "Test Story",
    status: "backlog",
    epicId: "1",
    description: "",
    acceptanceCriteria: [],
    tasks: [],
    completedTasks: 0,
    totalTasks: 0,
    ...overrides,
  };
}

function makeEpic(overrides: Partial<Epic> = {}): Epic {
  return {
    id: "1",
    title: "Test Epic",
    description: "",
    status: "not-started",
    stories: ["1.1"],
    totalStories: 1,
    completedStories: 0,
    progressPercent: 0,
    ...overrides,
  };
}

describe("correlate", () => {
  it("does not mutate the input stories array", () => {
    const stories = [makeStory({ id: "1.1", status: "backlog" })];
    const epics = [makeEpic()];
    const sprint: SprintStatus = {
      stories: [{ id: "1.1", title: "1-1-test", status: "done", epicId: "1" }],
    };

    const originalStatus = stories[0].status;
    correlate(sprint, epics, stories);

    // The original story should NOT be mutated
    expect(stories[0].status).toBe(originalStatus);
  });

  it("returns stories unchanged when sprintStatus is null", () => {
    const stories = [makeStory({ id: "1.1", status: "backlog" })];
    const epics = [makeEpic()];
    const result = correlate(null, epics, stories);

    expect(result.stories).toHaveLength(1);
    expect(result.stories[0].status).toBe("backlog");
  });

  it("sprint status overrides story markdown status", () => {
    const stories = [makeStory({ id: "1.1", status: "backlog" })];
    const epics = [makeEpic()];
    const sprint: SprintStatus = {
      stories: [{ id: "1.1", title: "1-1-test", status: "done", epicId: "1" }],
    };

    const result = correlate(sprint, epics, stories);
    expect(result.stories[0].status).toBe("done");
  });

  it("creates stub for story only in sprint status", () => {
    const stories: StoryDetail[] = [];
    const epics = [makeEpic({ stories: ["2.1"] })];
    const sprint: SprintStatus = {
      stories: [
        { id: "2.1", title: "2-1-new-feature", status: "in-progress", epicId: "2" },
      ],
    };

    const result = correlate(sprint, epics, stories);
    expect(result.stories).toHaveLength(1);
    expect(result.stories[0].id).toBe("2.1");
    expect(result.stories[0].status).toBe("in-progress");
    expect(result.stories[0].title).toBe("New Feature");
  });

  describe("progressPercent calculation", () => {
    it("returns 0% when no stories are done", () => {
      const stories = [
        makeStory({ id: "1.1", status: "backlog" }),
        makeStory({ id: "1.2", status: "in-progress" }),
        makeStory({ id: "1.3", status: "blocked" }),
      ];
      const epics = [makeEpic({ stories: ["1.1", "1.2", "1.3"] })];
      const result = correlate(null, epics, stories);

      expect(result.epics[0].progressPercent).toBe(0);
      expect(result.epics[0].status).toBe("in-progress");
    });

    it("returns 33% when 1 of 3 stories done", () => {
      const stories = [
        makeStory({ id: "1.1", status: "done" }),
        makeStory({ id: "1.2", status: "backlog" }),
        makeStory({ id: "1.3", status: "backlog" }),
      ];
      const epics = [makeEpic({ stories: ["1.1", "1.2", "1.3"] })];
      const result = correlate(null, epics, stories);

      expect(result.epics[0].progressPercent).toBe(33);
    });

    it("returns 100% when all stories done", () => {
      const stories = [
        makeStory({ id: "1.1", status: "done" }),
        makeStory({ id: "1.2", status: "done" }),
      ];
      const epics = [makeEpic({ stories: ["1.1", "1.2"] })];
      const result = correlate(null, epics, stories);

      expect(result.epics[0].progressPercent).toBe(100);
      expect(result.epics[0].status).toBe("done");
    });
  });

  it("assigns epicTitle to stories from enriched epics", () => {
    const stories = [makeStory({ id: "1.1", epicId: "1" })];
    const epics = [makeEpic({ id: "1", title: "My Epic" })];
    const result = correlate(null, epics, stories);

    expect(result.stories[0].epicTitle).toBe("My Epic");
  });

  it("uses epicStatuses from sprint-status.yaml when provided", () => {
    const stories = [makeStory({ id: "1.1", status: "backlog" })];
    const epics = [makeEpic()];
    const epicStatuses = [{ id: "1", status: "done" as const }];

    const result = correlate(null, epics, stories, epicStatuses);
    expect(result.epics[0].status).toBe("done");
  });
});
