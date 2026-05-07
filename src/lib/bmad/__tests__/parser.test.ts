import { describe, it, expect } from "vitest";

/**
 * Unit tests for the storyPaths filter logic in parser.ts.
 * We extract the filter predicate here to test it in isolation without
 * needing a full ContentProvider mock.
 */
function isStoryFile(filename: string): boolean {
  if (/^\d+-\d+-.+\.md$/.test(filename)) return true;
  if (/^[a-z][a-z0-9_-]*-\d+-.+\.md$/i.test(filename)) return true;
  if (/^story[_-]?\d/i.test(filename)) return true;
  return false;
}

describe("storyPaths filter", () => {
  describe("numeric filenames (existing behavior)", () => {
    it("includes N-N-title.md", () => {
      expect(isStoryFile("1-1-project-initialization.md")).toBe(true);
    });

    it("includes large numbers", () => {
      expect(isStoryFile("10-3-auth-flow.md")).toBe(true);
    });

    it("includes story-N.md (legacy)", () => {
      expect(isStoryFile("story-1.md")).toBe(true);
    });

    it("includes story_N.md (legacy)", () => {
      expect(isStoryFile("story_2.md")).toBe(true);
    });
  });

  describe("alphanumeric filenames (new support)", () => {
    it("includes alpha-N-title.md", () => {
      expect(isStoryFile("di-1-task.md")).toBe(true);
    });

    it("includes multi-char prefix with number", () => {
      expect(isStoryFile("hk-5-gate-qa.md")).toBe(true);
    });

    it("includes uppercase prefix (case-insensitive)", () => {
      expect(isStoryFile("DI-1-task.md")).toBe(true);
    });
  });

  describe("excluded files", () => {
    it("excludes alpha files missing the number segment", () => {
      // "di-foo.md" looks like an alpha file but has no storyNumber — not a story
      expect(isStoryFile("di-foo.md")).toBe(false);
    });

    it("excludes generic markdown files", () => {
      expect(isStoryFile("readme.md")).toBe(false);
    });

    it("excludes sprint-status.yaml (not .md)", () => {
      expect(isStoryFile("sprint-status.yaml")).toBe(false);
    });

    it("excludes files with only one numeric segment", () => {
      expect(isStoryFile("1-task.md")).toBe(false);
    });

    it("excludes files starting with digit that look like N-N but miss slug", () => {
      expect(isStoryFile("1-1.md")).toBe(false);
    });
  });
});
