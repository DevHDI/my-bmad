import { describe, it, expect, vi } from "vitest";
import {
  parseConfigContent,
  getBmadConfig,
  isPathOutsideNestedOutput,
  DEFAULT_OUTPUT_DIR,
  CORE_CONFIG_PATH,
} from "../parse-config";
import type { ContentProvider } from "@/lib/content-provider";

function makeProvider(files: Record<string, string>): ContentProvider {
  return {
    async getTree() {
      return { paths: Object.keys(files), rootDirectories: [] };
    },
    async getFileContent(path: string) {
      if (!(path in files)) throw new Error(`Not found: ${path}`);
      return files[path];
    },
    async validateRoot() {},
  };
}

describe("parseConfigContent", () => {
  it("extracts output_folder and strips {project-root} prefix", () => {
    const yaml = `
user_name: Hichem
output_folder: "{project-root}/_bmad-output"
`;
    expect(parseConfigContent(yaml)).toEqual({ outputDir: "_bmad-output" });
  });

  it("supports custom output paths", () => {
    const yaml = `output_folder: "{project-root}/custom/out"`;
    expect(parseConfigContent(yaml)).toEqual({ outputDir: "custom/out" });
  });

  it("handles output_folder without {project-root} prefix", () => {
    const yaml = `output_folder: my-output`;
    expect(parseConfigContent(yaml)).toEqual({ outputDir: "my-output" });
  });

  it("strips trailing and leading slashes", () => {
    const yaml = `output_folder: "{project-root}//_bmad-output/"`;
    expect(parseConfigContent(yaml)).toEqual({ outputDir: "_bmad-output" });
  });

  it("returns null when output_folder is missing", () => {
    const yaml = `user_name: Hichem`;
    expect(parseConfigContent(yaml)).toBeNull();
  });

  it("returns null when output_folder is empty", () => {
    const yaml = `output_folder: ""`;
    expect(parseConfigContent(yaml)).toBeNull();
  });

  it("returns null when output_folder reduces to empty after stripping prefix", () => {
    const yaml = `output_folder: "{project-root}/"`;
    expect(parseConfigContent(yaml)).toBeNull();
  });

  it("returns null for invalid YAML", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseConfigContent("key:\n\t- bad:\n\t\t\t- value")).toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns null when YAML is not an object", () => {
    expect(parseConfigContent("just a string")).toBeNull();
  });

  it("returns null when output_folder is not a string", () => {
    const yaml = `output_folder: 42`;
    expect(parseConfigContent(yaml)).toBeNull();
  });
});

describe("getBmadConfig", () => {
  it("returns parsed config when core/config.yaml exists", async () => {
    const provider = makeProvider({
      [CORE_CONFIG_PATH]: `output_folder: "{project-root}/custom-out"`,
    });
    const config = await getBmadConfig(provider, [CORE_CONFIG_PATH]);
    expect(config.outputDir).toBe("custom-out");
  });

  it("falls back to default when config file is missing", async () => {
    const provider = makeProvider({});
    const config = await getBmadConfig(provider, ["some/other/file.md"]);
    expect(config.outputDir).toBe(DEFAULT_OUTPUT_DIR);
  });

  it("falls back to default when config YAML is malformed", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = makeProvider({
      [CORE_CONFIG_PATH]: `key:\n\t- bad`,
    });
    const config = await getBmadConfig(provider, [CORE_CONFIG_PATH]);
    expect(config.outputDir).toBe(DEFAULT_OUTPUT_DIR);
    consoleSpy.mockRestore();
  });

  it("falls back to default when config is missing output_folder", async () => {
    const provider = makeProvider({
      [CORE_CONFIG_PATH]: `user_name: Hichem`,
    });
    const config = await getBmadConfig(provider, [CORE_CONFIG_PATH]);
    expect(config.outputDir).toBe(DEFAULT_OUTPUT_DIR);
  });

  it("falls back to default when fetching the config file throws", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider: ContentProvider = {
      async getTree() {
        return { paths: [CORE_CONFIG_PATH], rootDirectories: [] };
      },
      async getFileContent() {
        throw new Error("network error");
      },
      async validateRoot() {},
    };
    const config = await getBmadConfig(provider, [CORE_CONFIG_PATH]);
    expect(config.outputDir).toBe(DEFAULT_OUTPUT_DIR);
    consoleSpy.mockRestore();
  });
});

describe("isPathOutsideNestedOutput", () => {
  it("returns false for a single-segment outputDir (no nesting concern)", () => {
    expect(isPathOutsideNestedOutput("_bmad-output/file.md", "_bmad-output")).toBe(false);
    // Even a path with the same top but technically outside has nothing
    // nested to escape from — the provider's own whitelist is the boundary.
    expect(isPathOutsideNestedOutput("foo/x.md", "_bmad-output")).toBe(false);
  });

  it("allows reads under the configured nested outputDir", () => {
    expect(isPathOutsideNestedOutput("custom/out/foo.md", "custom/out")).toBe(false);
    expect(isPathOutsideNestedOutput("custom/out/sub/bar.md", "custom/out")).toBe(false);
  });

  it("denies sibling reads under the same top segment", () => {
    expect(isPathOutsideNestedOutput("custom/secret.txt", "custom/out")).toBe(true);
    expect(isPathOutsideNestedOutput("custom/other/foo.md", "custom/out")).toBe(true);
  });

  it("does not flag paths under unrelated top segments", () => {
    expect(isPathOutsideNestedOutput("_bmad/core/config.yaml", "custom/out")).toBe(false);
    expect(isPathOutsideNestedOutput("docs/readme.md", "custom/out")).toBe(false);
  });

  it("denies the bare top segment itself when nested output is configured", () => {
    // "custom" alone is not under "custom/out/" → must be denied
    expect(isPathOutsideNestedOutput("custom", "custom/out")).toBe(true);
  });

  it("treats outputDir with the prefix exactly as outputDir's name (not a substring)", () => {
    // "custom/output-something" should NOT be considered under "custom/out"
    expect(isPathOutsideNestedOutput("custom/output-something/file.md", "custom/out")).toBe(true);
  });
});
