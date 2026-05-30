import { describe, it, expect } from "vitest";
import { parseEpics } from "../parse-epics";

describe("parseEpics", () => {
  it("returns empty array for empty content", () => {
    const result = parseEpics("");
    expect(result.epics).toEqual([]);
    expect(result.error).toBeUndefined();
  });

  it("returns empty array for content with no epic headings", () => {
    const result = parseEpics("# Project Overview\n\nSome text");
    expect(result.epics).toEqual([]);
  });

  it("parses a single epic with story references", () => {
    const content = `## Epic 1: Project Setup
This epic handles initial project configuration.
- Story 1.1 - Initialize repo
- Story 1.2 - Setup CI/CD
`;
    const result = parseEpics(content);
    expect(result.epics).toHaveLength(1);
    expect(result.epics[0].id).toBe("1");
    expect(result.epics[0].title).toBe("Project Setup");
    expect(result.epics[0].stories).toContain("1.1");
    expect(result.epics[0].stories).toContain("1.2");
    expect(result.epics[0].totalStories).toBe(2);
    expect(result.epics[0].status).toBe("not-started");
  });

  it("parses multiple consecutive epics", () => {
    const content = `## Epic 1: First Epic
Description of first epic.
- Story 1.1 - Task A

## Epic 2: Second Epic
Description of second epic.
- Story 2.1 - Task B
- Story 2.2 - Task C
`;
    const result = parseEpics(content);
    expect(result.epics).toHaveLength(2);
    expect(result.epics[0].id).toBe("1");
    expect(result.epics[0].title).toBe("First Epic");
    expect(result.epics[0].stories).toEqual(["1.1"]);
    expect(result.epics[1].id).toBe("2");
    expect(result.epics[1].title).toBe("Second Epic");
    expect(result.epics[1].stories).toEqual(["2.1", "2.2"]);
  });

  it("truncates description to 500 characters", () => {
    const longDesc = "A".repeat(600);
    const content = `## Epic 1: Long Epic\n${longDesc}`;
    const result = parseEpics(content);
    expect(result.epics).toHaveLength(1);
    expect(result.epics[0].description.length).toBeLessThanOrEqual(500);
  });

  it("handles epic heading without 'Epic' keyword", () => {
    const content = `## 1 - Project Setup\nDescription`;
    const result = parseEpics(content);
    expect(result.epics).toHaveLength(1);
    expect(result.epics[0].id).toBe("1");
    expect(result.epics[0].title).toBe("Project Setup");
  });

  it("deduplicates story references", () => {
    const content = `## Epic 1: Setup
- Story 1.1 - First mention
- Story 1.1 - Duplicate mention
`;
    const result = parseEpics(content);
    expect(result.epics[0].stories).toEqual(["1.1"]);
  });

  it("parses alphanumeric epic headings only when Epic keyword is present", () => {
    const content = `## Epic DevOps/Infra: Pipeline Quality
- Story DI.1 - First task
- Story DI.2 - Second task
### Story DI.3: Third task

## Introduction: Overview
This is not an epic.
`;
    const result = parseEpics(content);

    expect(result.epics).toHaveLength(1);
    expect(result.epics[0].id).toBe("devops-infra");
    expect(result.epics[0].title).toBe("Pipeline Quality");
    expect(result.epics[0].stories).toEqual(["di.1", "di.2", "di.3"]);
  });

  it("parses mixed numeric and alphanumeric epics in sequence", () => {
    const content = `## Epic 1: Foundation
- Story 1.1 - Init

## Epic Housekeeping: Cleanup
- Story HK.1 - Remove stale files

## Epic 2: Features
- Story 2.1 - Auth
`;
    const result = parseEpics(content);

    expect(result.epics.map((epic) => epic.id)).toEqual([
      "1",
      "housekeeping",
      "2",
    ]);
    expect(result.epics[1].stories).toEqual(["hk.1"]);
  });
});
