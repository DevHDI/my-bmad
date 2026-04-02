import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { LocalProvider } from "../local-provider";

let tmpDir: string;

beforeEach(async () => {
  process.env.ENABLE_LOCAL_FS = "true";
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lp-test-"));
});

afterEach(async () => {
  delete process.env.ENABLE_LOCAL_FS;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function writeFile(relativePath: string, content = "test") {
  const full = path.join(tmpDir, relativePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content);
}

describe("LocalProvider", () => {
  describe("validateRoot()", () => {
    it("succeeds for an existing directory", async () => {
      const provider = new LocalProvider(tmpDir);
      await expect(provider.validateRoot()).resolves.toBeUndefined();
    });

    it("throws PATH_NOT_FOUND if path does not exist", async () => {
      const provider = new LocalProvider(path.join(tmpDir, "nonexistent"));
      await expect(provider.validateRoot()).rejects.toThrow("PATH_NOT_FOUND");
    });

    it("throws PATH_NOT_FOUND if path is a file, not a directory", async () => {
      const filePath = path.join(tmpDir, "afile.txt");
      await fs.writeFile(filePath, "content");
      const provider = new LocalProvider(filePath);
      await expect(provider.validateRoot()).rejects.toThrow("PATH_NOT_FOUND");
    });
  });

  describe("getTree()", () => {
    it("returns the correct list of files recursively", async () => {
      await writeFile("_bmad-output/a.txt");
      await writeFile("_bmad-output/sub/b.txt");
      await writeFile("_bmad-output/sub/deep/c.txt");

      const provider = new LocalProvider(tmpDir);
      const tree = await provider.getTree();

      expect(tree.paths).toContain(path.join("_bmad-output", "a.txt"));
      expect(tree.paths).toContain(path.join("_bmad-output", "sub", "b.txt"));
      expect(tree.paths).toContain(path.join("_bmad-output", "sub", "deep", "c.txt"));
    });

    it("returns only files, not directories", async () => {
      await writeFile("_bmad-output/file.txt");

      const provider = new LocalProvider(tmpDir);
      const tree = await provider.getTree();

      expect(tree.paths).toEqual([path.join("_bmad-output", "file.txt")]);
    });

    it("returns empty list for empty directory", async () => {
      const provider = new LocalProvider(tmpDir);
      const tree = await provider.getTree();

      expect(tree.paths).toEqual([]);
      expect(tree.rootDirectories).toEqual([]);
    });

    it("populates rootDirectories with top-level directories", async () => {
      await writeFile("_bmad/config.yaml");
      await writeFile("docs/readme.md");
      await writeFile("root.txt");

      const provider = new LocalProvider(tmpDir);
      const tree = await provider.getTree();

      expect(tree.rootDirectories).toContain("_bmad");
      expect(tree.rootDirectories).toContain("docs");
      expect(tree.rootDirectories).not.toContain("root.txt");
    });

    it("respects maxFileCount limit", async () => {
      for (let i = 0; i < 5; i++) {
        await writeFile(`_bmad/file${i}.txt`);
      }

      const provider = new LocalProvider(tmpDir, { maxFileCount: 3 });
      await expect(provider.getTree()).rejects.toThrow("File count exceeds limit");
    });

    it("ignores files beyond maxDepth", async () => {
      await writeFile("_bmad/a.txt");
      await writeFile("_bmad/d1/d2/d3/deep.txt");

      // maxDepth 2 means: root(0) → _bmad(1) → a.txt OK, d1(2) → but d2/d3 beyond
      const provider = new LocalProvider(tmpDir, { maxDepth: 2 });
      const tree = await provider.getTree();

      expect(tree.paths).toContain(path.join("_bmad", "a.txt"));
      expect(tree.paths).not.toContain(path.join("_bmad", "d1", "d2", "d3", "deep.txt"));
    });
  });

  describe("getFileContent()", () => {
    it("returns the correct file content", async () => {
      await writeFile("hello.txt", "Hello World");

      const provider = new LocalProvider(tmpDir);
      const content = await provider.getFileContent("hello.txt");

      expect(content).toBe("Hello World");
    });

    it("throws for non-existent file", async () => {
      const provider = new LocalProvider(tmpDir);
      await expect(provider.getFileContent("nope.txt")).rejects.toThrow();
    });

    it("throws for files exceeding size limit", async () => {
      const bigContent = "x".repeat(100);
      await writeFile("big.txt", bigContent);

      const provider = new LocalProvider(tmpDir, { maxFileSizeBytes: 50 });
      await expect(provider.getFileContent("big.txt")).rejects.toThrow(
        "exceeds limit"
      );
    });
  });
});
