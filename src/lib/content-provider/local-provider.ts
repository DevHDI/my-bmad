import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import type { ContentProvider, ContentProviderTree } from "./types";
import { LOCAL_PROVIDER_DEFAULTS } from "./types";

interface LocalProviderOptions {
  maxFileSizeBytes?: number;
  maxFileCount?: number;
  maxDepth?: number;
}

export class LocalProvider implements ContentProvider {
  private resolvedRoot: string;
  private maxFileSizeBytes: number;
  private maxFileCount: number;
  private maxDepth: number;

  constructor(rootPath: string, options?: LocalProviderOptions) {
    // Guard 1 — Feature flag
    if (process.env.ENABLE_LOCAL_FS !== "true") {
      throw new Error("LOCAL_DISABLED");
    }

    // Runtime check: Node.js >= 20.12.0 required for Dirent.parentPath
    // parentPath is an instance property (not on prototype), so check via version
    const [major, minor] = process.versions.node.split(".").map(Number);
    if (major < 20 || (major === 20 && minor < 12)) {
      throw new Error(
        "LocalProvider requires Node.js >= 20.12.0 (Dirent.parentPath support)"
      );
    }

    this.resolvedRoot = path.resolve(rootPath);
    this.maxFileSizeBytes =
      options?.maxFileSizeBytes ?? LOCAL_PROVIDER_DEFAULTS.maxFileSizeBytes;
    this.maxFileCount =
      options?.maxFileCount ?? LOCAL_PROVIDER_DEFAULTS.maxFileCount;
    this.maxDepth = options?.maxDepth ?? LOCAL_PROVIDER_DEFAULTS.maxDepth;
  }

  async validateRoot(): Promise<void> {
    try {
      await fs.access(this.resolvedRoot, constants.R_OK);
    } catch {
      throw new Error("PATH_NOT_FOUND");
    }

    const stat = await fs.stat(this.resolvedRoot);
    if (!stat.isDirectory()) {
      throw new Error("PATH_NOT_FOUND");
    }
  }

  /** Directories skipped during tree scan (not relevant to BMAD projects). */
  private static IGNORED_DIRS = new Set([
    "node_modules",
    ".git",
    ".next",
    ".nuxt",
    ".svelte-kit",
    "dist",
    "build",
    ".cache",
    ".turbo",
    ".vercel",
    ".output",
    "__pycache__",
    ".venv",
    "venv",
    "target",
    ".now",
  ]);

  async getTree(): Promise<ContentProviderTree> {
    const paths: string[] = [];
    const rootDirectories: string[] = [];
    let fileCount = 0;

    const walk = async (dir: string, depth: number) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const dirent of entries) {
        // Guard 3 — Symlink detection: skip symlinks
        if (dirent.isSymbolicLink()) {
          continue;
        }

        if (dirent.isDirectory()) {
          // Collect root-level directories (depth 0)
          if (depth === 0) {
            rootDirectories.push(dirent.name);
          }

          // Skip ignored directories
          if (LocalProvider.IGNORED_DIRS.has(dirent.name)) {
            continue;
          }

          // Guard 6 — Depth limit
          if (depth < this.maxDepth) {
            await walk(path.join(dir, dirent.name), depth + 1);
          }
          continue;
        }

        if (!dirent.isFile()) {
          continue;
        }

        // Guard 5 — File count limit
        fileCount++;
        if (fileCount > this.maxFileCount) {
          throw new Error(
            `File count exceeds limit of ${this.maxFileCount}`
          );
        }

        const fullPath = path.join(dir, dirent.name);
        paths.push(path.relative(this.resolvedRoot, fullPath));
      }
    };

    await walk(this.resolvedRoot, 0);

    return { paths, rootDirectories };
  }

  async getFileContent(filePath: string): Promise<string> {
    this.assertSafePath(filePath);

    const fullPath = path.resolve(this.resolvedRoot, filePath);

    // Guard 3 — Symlink detection via lstat
    const lstat = await fs.lstat(fullPath);
    if (lstat.isSymbolicLink()) {
      throw new Error("Symlinks are not allowed");
    }

    // Guard 4 — File size limit
    if (lstat.size > this.maxFileSizeBytes) {
      throw new Error(
        `File size ${lstat.size} exceeds limit of ${this.maxFileSizeBytes} bytes`
      );
    }

    return fs.readFile(fullPath, "utf-8");
  }

  /**
   * Guard 2 — Path traversal jail.
   * Ensures the resolved path stays within resolvedRoot.
   * Also rejects null bytes and Unicode slash look-alikes.
   */
  private assertSafePath(filePath: string): void {
    // Reject null bytes (F12)
    if (filePath.includes("\0")) {
      throw new Error("Invalid path: null bytes not allowed");
    }

    // Reject Unicode slash look-alikes (F23: U+2215, U+FF0F)
    if (/[\u2215\uFF0F]/.test(filePath)) {
      throw new Error("Invalid path: unsupported characters");
    }

    const resolved = path.resolve(this.resolvedRoot, filePath);
    if (!resolved.startsWith(this.resolvedRoot + path.sep) && resolved !== this.resolvedRoot) {
      throw new Error("Path traversal detected");
    }
  }
}
