import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { LocalProvider } from "../local-provider";

let tmpDir: string;

beforeEach(async () => {
  process.env.ENABLE_LOCAL_FS = "true";
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sec-test-"));
  // Create a file inside the jail for valid tests
  await fs.mkdir(path.join(tmpDir, "sub"), { recursive: true });
  await fs.writeFile(path.join(tmpDir, "sub", "safe.txt"), "safe");
});

afterEach(async () => {
  delete process.env.ENABLE_LOCAL_FS;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("LocalProvider Security", () => {
  describe("Feature flag guard", () => {
    it("throws LOCAL_DISABLED when ENABLE_LOCAL_FS is not set", () => {
      delete process.env.ENABLE_LOCAL_FS;
      expect(() => new LocalProvider(tmpDir)).toThrow("LOCAL_DISABLED");
    });

    it("throws LOCAL_DISABLED when ENABLE_LOCAL_FS is false", () => {
      process.env.ENABLE_LOCAL_FS = "false";
      expect(() => new LocalProvider(tmpDir)).toThrow("LOCAL_DISABLED");
    });
  });

  describe("Path traversal protection", () => {
    it("rejects ../../../etc/passwd", async () => {
      const provider = new LocalProvider(tmpDir);
      await expect(
        provider.getFileContent("../../../etc/passwd")
      ).rejects.toThrow("Path traversal detected");
    });

    it("rejects path with .. component", async () => {
      const provider = new LocalProvider(tmpDir);
      await expect(
        provider.getFileContent("sub/../../etc/passwd")
      ).rejects.toThrow("Path traversal detected");
    });

    it("rejects absolute path outside rootPath", async () => {
      const provider = new LocalProvider(tmpDir);
      await expect(provider.getFileContent("/etc/passwd")).rejects.toThrow(
        "Path traversal detected"
      );
    });

    it("rejects null bytes in path (F12)", async () => {
      const provider = new LocalProvider(tmpDir);
      await expect(
        provider.getFileContent("safe\0.txt")
      ).rejects.toThrow("null bytes");
    });

    it("rejects Unicode slash look-alike U+2215 (F23)", async () => {
      const provider = new LocalProvider(tmpDir);
      await expect(
        provider.getFileContent("sub\u2215..safe.txt")
      ).rejects.toThrow("unsupported characters");
    });

    it("rejects Unicode slash look-alike U+FF0F (F23)", async () => {
      const provider = new LocalProvider(tmpDir);
      await expect(
        provider.getFileContent("sub\uFF0F..safe.txt")
      ).rejects.toThrow("unsupported characters");
    });
  });

  describe("Symlink protection (F9)", () => {
    it("rejects symlinks in getFileContent()", async () => {
      const outsideFile = path.join(os.tmpdir(), "outside-secret.txt");
      await fs.writeFile(outsideFile, "secret");

      const symlinkPath = path.join(tmpDir, "link.txt");
      await fs.symlink(outsideFile, symlinkPath);

      const provider = new LocalProvider(tmpDir);
      await expect(provider.getFileContent("link.txt")).rejects.toThrow(
        "Symlinks are not allowed"
      );

      // Cleanup
      await fs.unlink(outsideFile);
    });

    it("excludes symlinks from getTree()", async () => {
      const outsideFile = path.join(os.tmpdir(), "outside-secret2.txt");
      await fs.writeFile(outsideFile, "secret");

      await fs.symlink(outsideFile, path.join(tmpDir, "linked.txt"));

      const provider = new LocalProvider(tmpDir);
      const tree = await provider.getTree();

      expect(tree.paths).not.toContain("linked.txt");
      expect(tree.paths).toContain(path.join("sub", "safe.txt"));

      await fs.unlink(outsideFile);
    });
  });

  describe("File size limit", () => {
    it("rejects files exceeding maxFileSizeBytes", async () => {
      await fs.writeFile(
        path.join(tmpDir, "big.txt"),
        "x".repeat(200)
      );

      const provider = new LocalProvider(tmpDir, { maxFileSizeBytes: 100 });
      await expect(provider.getFileContent("big.txt")).rejects.toThrow(
        "exceeds limit"
      );
    });
  });

  describe("File count limit (F4)", () => {
    it("throws when file count exceeds maxFileCount", async () => {
      for (let i = 0; i < 10; i++) {
        await fs.writeFile(path.join(tmpDir, `f${i}.txt`), "x");
      }

      const provider = new LocalProvider(tmpDir, { maxFileCount: 5 });
      await expect(provider.getTree()).rejects.toThrow(
        "File count exceeds limit"
      );
    });
  });

  describe("Depth limit (F4)", () => {
    it("ignores files beyond maxDepth", async () => {
      // Create file at depth 3
      await fs.mkdir(path.join(tmpDir, "a", "b", "c"), { recursive: true });
      await fs.writeFile(path.join(tmpDir, "a", "b", "c", "deep.txt"), "x");
      await fs.writeFile(path.join(tmpDir, "shallow.txt"), "x");

      const provider = new LocalProvider(tmpDir, { maxDepth: 1 });
      const tree = await provider.getTree();

      expect(tree.paths).toContain("shallow.txt");
      expect(tree.paths).not.toContain(
        path.join("a", "b", "c", "deep.txt")
      );
    });
  });
});
