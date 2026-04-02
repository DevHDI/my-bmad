export interface ContentProviderTree {
  /** All file paths (blobs) in the repo/folder, relative to root. */
  paths: string[];
  /** Top-level directory names (e.g. ["_bmad", "docs"]). */
  rootDirectories: string[];
}

export interface ContentProvider {
  getTree(): Promise<ContentProviderTree>;
  getFileContent(filePath: string): Promise<string>;
  /** Verify that the root path exists and is accessible. Throws if not. */
  validateRoot(): Promise<void>;
}

export const LOCAL_PROVIDER_DEFAULTS = {
  maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
  maxFileCount: 10_000,
  maxDepth: 20,
} as const;
