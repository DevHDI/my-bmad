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

describe("correlate — alphanumeric IDs and backfill", () => {
  it("backfills epicId for a story whose epicId doesn't match any epic.id", () => {
    // Epic has id "devops-infra" and lists story "di.1"
    // Story file produces epicId "di" (from filename di-1-task.md)
    const stories = [makeStory({ id: "di.1", epicId: "di", status: "done" })];
    const epics = [makeEpic({ id: "devops-infra", title: "Pipeline Quality", stories: ["di.1"] })];

    const result = correlate(null, epics, stories);
    expect(result.stories[0].epicId).toBe("devops-infra");
    expect(result.stories[0].epicTitle).toBe("Pipeline Quality");
  });

  it("assigns correct progress to alphanumeric epic via backfill", () => {
    const stories = [
      makeStory({ id: "di.1", epicId: "di", status: "done" }),
      makeStory({ id: "di.2", epicId: "di", status: "backlog" }),
    ];
    const epics = [makeEpic({ id: "devops-infra", stories: ["di.1", "di.2"] })];

    const result = correlate(null, epics, stories);
    expect(result.epics[0].totalStories).toBe(2);
    expect(result.epics[0].completedStories).toBe(1);
    expect(result.epics[0].progressPercent).toBe(50);
  });

  it("mixes numeric and alphanumeric epics without interference", () => {
    const stories = [
      makeStory({ id: "1.1", epicId: "1", status: "done" }),
      makeStory({ id: "di.1", epicId: "di", status: "in-progress" }),
    ];
    const epics = [
      makeEpic({ id: "1", title: "Foundation", stories: ["1.1"] }),
      makeEpic({ id: "devops-infra", title: "DevOps", stories: ["di.1"] }),
    ];

    const result = correlate(null, epics, stories);
    expect(result.epics[0].id).toBe("1");
    expect(result.epics[0].completedStories).toBe(1);
    expect(result.epics[1].id).toBe("devops-infra");
    expect(result.epics[1].status).toBe("in-progress");
  });

  it("does not backfill when epicId already matches an epic", () => {
    const stories = [makeStory({ id: "1.1", epicId: "1", status: "backlog" })];
    const epics = [makeEpic({ id: "1", stories: ["1.1"] })];

    const result = correlate(null, epics, stories);
    // epicId should remain "1" (the matching epic), not get replaced
    expect(result.stories[0].epicId).toBe("1");
  });
});
