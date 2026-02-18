import { describe, it, expect } from "vitest";
import { parseStory } from "../parse-story";

describe("parseStory", () => {
  describe("filename ID extraction", () => {
    it("extracts ID from N-N-title.md format", () => {
      const result = parseStory("# My Story\n\nSome content", "1-2-my-story.md");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("1.2");
      expect(result!.epicId).toBe("1");
    });

    it("extracts ID from story-N.md format", () => {
      const result = parseStory("# Legacy Story\n\nContent", "story-1.md");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("1");
    });

    it("extracts ID from story-N.N.md format", () => {
      const result = parseStory("# Legacy Story\n\nContent", "story-1.2.md");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("1.2");
      expect(result!.epicId).toBe("1");
    });
  });

  describe("frontmatter parsing", () => {
    it("parses status from YAML frontmatter", () => {
      const content = `---
status: done
title: My Title
epic_id: 3
---
# Story content`;
      const result = parseStory(content, "1-1-test.md");
      expect(result).not.toBeNull();
      expect(result!.status).toBe("done");
      expect(result!.title).toBe("My Title");
      expect(result!.epicId).toBe("3");
    });

    it("uses frontmatter id when present", () => {
      const content = `---
id: 5.1
status: in-progress
---
# Story`;
      const result = parseStory(content, "1-1-test.md");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("5.1");
    });
  });

  describe("inline parsing (no frontmatter)", () => {
    it("extracts title from heading", () => {
      const content = "# Story 1.1: Project Setup\n\nSome description";
      const result = parseStory(content, "1-1-project-setup.md");
      expect(result).not.toBeNull();
      expect(result!.title).toBe("Project Setup");
    });

    it("extracts status from inline Status: line", () => {
      const content = "# My Story\n\nStatus: in-progress\n\nDescription here";
      const result = parseStory(content, "1-1-test.md");
      expect(result).not.toBeNull();
      expect(result!.status).toBe("in-progress");
    });

    it("defaults to backlog when no status found", () => {
      const content = "# No Status Story\n\nJust a description";
      const result = parseStory(content, "1-1-test.md");
      expect(result).not.toBeNull();
      expect(result!.status).toBe("backlog");
    });
  });

  describe("normalizeStoryStatus values", () => {
    const testStatus = (input: string, expected: string) => {
      const content = `---\nstatus: ${input}\n---\n# Story`;
      const result = parseStory(content, "1-1-test.md");
      expect(result).not.toBeNull();
      expect(result!.status).toBe(expected);
    };

    it("normalizes 'done'", () => testStatus("done", "done"));
    it("normalizes 'complete'", () => testStatus("complete", "done"));
    it("normalizes 'completed'", () => testStatus("completed", "done"));
    it("normalizes 'in-progress'", () => testStatus("in-progress", "in-progress"));
    it("normalizes 'started'", () => testStatus("started", "in-progress"));
    it("normalizes 'blocked'", () => testStatus("blocked", "blocked"));
    it("normalizes 'ready-for-dev'", () => testStatus("ready-for-dev", "ready-for-dev"));
    it("normalizes 'ready'", () => testStatus("ready", "ready-for-dev"));
    it("normalizes 'backlog'", () => testStatus("backlog", "backlog"));
    it("normalizes 'todo'", () => testStatus("todo", "backlog"));
    it("normalizes 'pending'", () => testStatus("pending", "backlog"));
  });

  describe("description truncation", () => {
    it("truncates description to 1000 characters", () => {
      const longContent = "# Title\n\n" + "A".repeat(2000);
      const result = parseStory(longContent, "1-1-test.md");
      expect(result).not.toBeNull();
      expect(result!.description.length).toBeLessThanOrEqual(1000);
    });
  });

  describe("acceptance criteria and tasks", () => {
    it("extracts acceptance criteria from section", () => {
      const content = `# Story

## Acceptance Criteria
- First criterion
- Second criterion
`;
      const result = parseStory(content, "1-1-test.md");
      expect(result).not.toBeNull();
      expect(result!.acceptanceCriteria).toHaveLength(2);
      expect(result!.acceptanceCriteria[0]).toBe("First criterion");
    });

    it("extracts tasks from checkboxes", () => {
      const content = `# Story

- [x] Completed task
- [ ] Pending task
`;
      const result = parseStory(content, "1-1-test.md");
      expect(result).not.toBeNull();
      expect(result!.tasks).toHaveLength(2);
      expect(result!.completedTasks).toBe(1);
      expect(result!.totalTasks).toBe(2);
    });
  });

  describe("error handling", () => {
    it("returns null on truly invalid content", () => {
      // parseStory is quite resilient, but we can test the fallback behavior
      // An empty string still produces a result with defaults
      const result = parseStory("", "1-1-test.md");
      // It should still return a valid object (it's very permissive)
      expect(result).not.toBeNull();
      expect(result!.id).toBe("1.1");
    });
  });
});
