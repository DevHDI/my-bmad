import { describe, it, expect } from "vitest";
import { parseSprintStatus } from "../parse-sprint-status";

describe("parseSprintStatus", () => {
  describe("development_status map format", () => {
    it("parses story entries from development_status", () => {
      const content = `
development_status:
  1-1-project-initialization: done
  1-2-setup-ci: in-progress
`;
      const result = parseSprintStatus(content);
      expect(result).not.toBeNull();
      expect(result!.sprintStatus.stories).toHaveLength(2);
      expect(result!.sprintStatus.stories[0]).toEqual({
        id: "1.1",
        title: "1-1-project-initialization",
        status: "done",
        epicId: "1",
      });
      expect(result!.sprintStatus.stories[1].status).toBe("in-progress");
    });

    it("parses epic entries from development_status", () => {
      const content = `
development_status:
  epic-1: done
  epic-2: in-progress
`;
      const result = parseSprintStatus(content);
      expect(result).not.toBeNull();
      expect(result!.epicStatuses).toHaveLength(2);
      expect(result!.epicStatuses[0]).toEqual({ id: "1", status: "done" });
      expect(result!.epicStatuses[1]).toEqual({ id: "2", status: "in-progress" });
    });

    it("skips retrospective entries", () => {
      const content = `
development_status:
  1-1-project-setup: done
  sprint-retrospective: completed
`;
      const result = parseSprintStatus(content);
      expect(result).not.toBeNull();
      expect(result!.sprintStatus.stories).toHaveLength(1);
    });

    it("parses alphanumeric epic and story keys", () => {
      const content = `
development_status:
  epic-devops-infra: in-progress
  di-1-pipeline-setup: done
  hk-2-cleanup: in-progress
`;
      const result = parseSprintStatus(content);

      expect(result).not.toBeNull();
      expect(result!.epicStatuses).toEqual([
        { id: "devops-infra", status: "in-progress" },
      ]);
      expect(result!.sprintStatus.stories).toEqual([
        {
          id: "di.1",
          title: "di-1-pipeline-setup",
          status: "done",
          epicId: "di",
        },
        {
          id: "hk.2",
          title: "hk-2-cleanup",
          status: "in-progress",
          epicId: "hk",
        },
      ]);
    });

    it("skips alphanumeric retrospective epic entries", () => {
      const content = `
development_status:
  di-1-task: done
  epic-devops-infra-retrospective: done
`;
      const result = parseSprintStatus(content);

      expect(result).not.toBeNull();
      expect(result!.epicStatuses).toHaveLength(0);
      expect(result!.sprintStatus.stories).toHaveLength(1);
    });
  });

  describe("legacy array format", () => {
    it("parses stories from array format", () => {
      const content = `
stories:
  - id: "1.1"
    title: "Setup"
    status: done
    epic_id: "1"
  - id: "1.2"
    title: "CI"
    status: blocked
`;
      const result = parseSprintStatus(content);
      expect(result).not.toBeNull();
      expect(result!.sprintStatus.stories).toHaveLength(2);
      expect(result!.sprintStatus.stories[0].id).toBe("1.1");
      expect(result!.sprintStatus.stories[0].status).toBe("done");
      expect(result!.sprintStatus.stories[1].status).toBe("blocked");
    });
  });

  describe("metadata fields", () => {
    it("parses sprint and status metadata", () => {
      const content = `
sprint: "Sprint 1"
status: active
start_date: "2026-01-01"
end_date: "2026-01-14"
development_status:
  1-1-setup: done
`;
      const result = parseSprintStatus(content);
      expect(result).not.toBeNull();
      expect(result!.sprintStatus.sprint).toBe("Sprint 1");
      expect(result!.sprintStatus.status).toBe("active");
      expect(result!.sprintStatus.startDate).toBe("2026-01-01");
      expect(result!.sprintStatus.endDate).toBe("2026-01-14");
    });
  });

  describe("error handling", () => {
    it("returns null for invalid YAML", () => {
      // Tab characters in YAML indentation cause js-yaml to throw
      const result = parseSprintStatus("key:\n\t- bad:\n\t\t\t\t- value");
      expect(result).toBeNull();
    });

    it("returns null for non-object YAML", () => {
      const result = parseSprintStatus("just a string");
      // yaml.load("just a string") returns a string, not object
      // The function checks typeof data !== "object" but a string passes typeof === "object" is false
      // Actually "just a string" loads as a string, so data is a string, typeof !== "object" => returns null
      expect(result).toBeNull();
    });
  });
});
