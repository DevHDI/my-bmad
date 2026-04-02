import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubProvider } from "../github-provider";

// Mock the GitHub client cached helpers
vi.mock("@/lib/github/client", () => ({
  getCachedUserRepoTree: vi.fn(),
  getCachedUserRawContent: vi.fn(),
}));

import {
  getCachedUserRepoTree,
  getCachedUserRawContent,
} from "@/lib/github/client";

const mockTree = getCachedUserRepoTree as ReturnType<typeof vi.fn>;
const mockContent = getCachedUserRawContent as ReturnType<typeof vi.fn>;

const fakeOctokit = {} as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GitHubProvider", () => {
  describe("getTree()", () => {
    it("returns paths from blob items and rootDirectories from tree items", async () => {
      mockTree.mockResolvedValue({
        sha: "abc",
        url: "",
        truncated: false,
        tree: [
          { path: "_bmad", type: "tree", mode: "040000", sha: "1", url: "" },
          { path: "docs", type: "tree", mode: "040000", sha: "2", url: "" },
          { path: "_bmad/config.yaml", type: "blob", mode: "100644", sha: "3", url: "", size: 100 },
          { path: "src/index.ts", type: "blob", mode: "100644", sha: "4", url: "", size: 200 },
          { path: "src/nested", type: "tree", mode: "040000", sha: "5", url: "" },
        ],
      });

      const provider = new GitHubProvider(fakeOctokit, "user1", "owner", "repo", "main");
      const tree = await provider.getTree();

      expect(tree.paths).toEqual(["_bmad/config.yaml", "src/index.ts"]);
      expect(tree.rootDirectories).toEqual(["_bmad", "docs"]);
      // Nested "tree" items with "/" should not be in rootDirectories
      expect(tree.rootDirectories).not.toContain("src/nested");
    });
  });

  describe("getFileContent()", () => {
    it("returns content from cached helper", async () => {
      mockContent.mockResolvedValue("file content here");

      const provider = new GitHubProvider(fakeOctokit, "user1", "owner", "repo", "main");
      const content = await provider.getFileContent("path/to/file.md");

      expect(content).toBe("file content here");
      expect(mockContent).toHaveBeenCalledWith(
        fakeOctokit,
        "user1",
        "owner",
        "repo",
        "main",
        "path/to/file.md"
      );
    });

    it("propagates errors from GitHub API", async () => {
      mockContent.mockRejectedValue(
        Object.assign(new Error("Not Found"), { status: 404 })
      );

      const provider = new GitHubProvider(fakeOctokit, "user1", "owner", "repo", "main");
      await expect(provider.getFileContent("missing.md")).rejects.toThrow(
        "Not Found"
      );
    });
  });

  describe("validateRoot()", () => {
    it("is a no-op", async () => {
      const provider = new GitHubProvider(fakeOctokit, "user1", "owner", "repo", "main");
      await expect(provider.validateRoot()).resolves.toBeUndefined();
    });
  });
});
