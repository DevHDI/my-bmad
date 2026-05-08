import { describe, it, expect } from "vitest";
import { getBmadProject } from "../parser";
import type { ContentProvider } from "@/lib/content-provider";
import type { RepoConfig } from "@/lib/types";

function makeProvider(files: Record<string, string>): ContentProvider {
  return {
    async getTree() {
      return { paths: Object.keys(files), rootDirectories: ["_bmad-output"] };
    },
    async getFileContent(p: string) {
      if (!(p in files)) throw new Error(`Not found: ${p}`);
      return files[p];
    },
    async validateRoot() {},
  };
}

const REPO: RepoConfig = {
  owner: "local",
  name: "test",
  branch: "main",
  displayName: "Test",
  description: null,
  sourceType: "local",
  localPath: "/tmp/test",
  lastSyncedAt: null,
};

describe("getBmadProject — nested output_folder", () => {
  it("scans a nested custom output dir like 'custom/out' when provider supports extension", async () => {
    let extendedTo: string | undefined;
    const allFiles = {
      "_bmad/core/config.yaml": `output_folder: "{project-root}/custom/out"`,
      "custom/out/planning-artifacts/epics.md": [
        "## Epic 1: Custom",
        "- Story 1.1 - Foo",
      ].join("\n"),
      "custom/out/implementation-artifacts/1-1-foo.md": [
        "# Foo",
        "Status: done",
      ].join("\n"),
    };
    let bmadDirs = new Set<string>(["_bmad", "_bmad-output"]);
    const provider: ContentProvider = {
      async getTree() {
        const visible = Object.keys(allFiles).filter((p) => {
          const seg = p.split("/")[0];
          return bmadDirs.has(seg);
        });
        return { paths: visible, rootDirectories: ["_bmad", "custom"] };
      },
      async getFileContent(p: string) {
        if (!(p in allFiles)) throw new Error(`Not found: ${p}`);
        return allFiles[p as keyof typeof allFiles];
      },
      async validateRoot() {},
      extendBmadDirs(name: string) {
        extendedTo = name;
        bmadDirs = new Set([...bmadDirs, name]);
      },
    };

    const project = await getBmadProject(REPO, provider);
    // The whitelist should have been extended to the top-level segment.
    expect(extendedTo).toBe("custom");
    expect(project!.epics).toHaveLength(1);
    expect(project!.epics[0].title).toBe("Custom");
    expect(project!.stories).toHaveLength(1);
    expect(project!.stories[0].id).toBe("1.1");
  });
});

describe("getBmadProject — epic-folder layout", () => {
  it("derives an epic from folder name when no epic.md is present", async () => {
    const provider = makeProvider({
      "_bmad-output/planning-artifacts/epics/epic-1-platform-setup/story-1-1.md": [
        "# Setup repo",
        "Status: done",
      ].join("\n"),
      "_bmad-output/planning-artifacts/epics/epic-1-platform-setup/story-1-2.md": [
        "# Configure CI",
        "Status: in-progress",
      ].join("\n"),
    });

    const project = await getBmadProject(REPO, provider);
    expect(project).not.toBeNull();
    expect(project!.epics).toHaveLength(1);
    expect(project!.epics[0]).toMatchObject({
      id: "1",
      title: "Platform Setup",
    });
    expect(project!.stories).toHaveLength(2);
    const ids = project!.stories.map((s) => s.id).sort();
    expect(ids).toEqual(["1.1", "1.2"]);
    expect(project!.stories.every((s) => s.epicId === "1")).toBe(true);
  });

  it("uses epic.md as meta when present and treats siblings as stories", async () => {
    const provider = makeProvider({
      "_bmad-output/planning-artifacts/epics/epic-2/epic.md": [
        "---",
        "id: 2",
        "title: Data Ingestion",
        "---",
        "",
        "Pipeline goals.",
      ].join("\n"),
      "_bmad-output/planning-artifacts/epics/epic-2/story-2-1.md": [
        "# Stream input",
        "Status: done",
      ].join("\n"),
    });

    const project = await getBmadProject(REPO, provider);
    expect(project!.epics).toHaveLength(1);
    expect(project!.epics[0]).toMatchObject({
      id: "2",
      title: "Data Ingestion",
    });
    expect(project!.stories).toHaveLength(1);
    expect(project!.stories[0].id).toBe("2.1");
    expect(project!.stories[0].epicId).toBe("2");
  });

  it("injects epicId on stories whose filename does not encode it", async () => {
    const provider = makeProvider({
      "_bmad-output/planning-artifacts/epics/epic-3/story-1.md": [
        "# Bare story",
        "Status: done",
      ].join("\n"),
    });

    const project = await getBmadProject(REPO, provider);
    expect(project!.stories).toHaveLength(1);
    // Filename is "story-1.md" → parseStory yields id="1"; folder context turns it into "3.1".
    expect(project!.stories[0].id).toBe("3.1");
    expect(project!.stories[0].epicId).toBe("3");
  });

  it("supports both layouts side-by-side (legacy + folder)", async () => {
    const provider = makeProvider({
      // Legacy: flat impl story under epic 1
      "_bmad-output/implementation-artifacts/1-1-foo.md": [
        "# Foo",
        "Status: done",
      ].join("\n"),
      // New: epic 2 as folder with derived meta
      "_bmad-output/planning-artifacts/epics/epic-2-bar/story-2-1.md": [
        "# Bar",
        "Status: in-progress",
      ].join("\n"),
    });

    const project = await getBmadProject(REPO, provider);
    expect(project!.epics).toHaveLength(1); // only epic 2 has a meta source
    expect(project!.epics[0].id).toBe("2");
    expect(project!.stories.map((s) => s.id).sort()).toEqual(["1.1", "2.1"]);
  });

  it("reconciles story epicId when epic.md declares an id different from the folder name", async () => {
    const provider = makeProvider({
      // Folder name implies id "2", but epic.md frontmatter says id "10"
      "_bmad-output/planning-artifacts/epics/epic-2-renamed/epic.md": [
        "---",
        "id: 10",
        "title: Renamed Epic",
        "---",
        "",
        "Body.",
      ].join("\n"),
      // Story filename only carries "1" — should resolve to "10.1", not "2.1"
      "_bmad-output/planning-artifacts/epics/epic-2-renamed/story-1.md": [
        "# Bare story",
        "Status: done",
      ].join("\n"),
    });

    const project = await getBmadProject(REPO, provider);
    expect(project!.epics).toHaveLength(1);
    expect(project!.epics[0].id).toBe("10");
    expect(project!.stories).toHaveLength(1);
    expect(project!.stories[0].id).toBe("10.1");
    expect(project!.stories[0].epicId).toBe("10");
    // Correlation must hold: epic shows 1/1 done.
    expect(project!.epics[0].completedStories).toBe(1);
    expect(project!.epics[0].totalStories).toBe(1);
  });

  it("ignores epic-folder when a single epics.md is present (single-file wins)", async () => {
    const provider = makeProvider({
      "_bmad-output/planning-artifacts/epics.md": [
        "## Epic 1: From single file",
        "- Story 1.1 - Foo",
      ].join("\n"),
      // This folder should be ignored because epics.md takes precedence
      "_bmad-output/planning-artifacts/epics/epic-2-other/story-2-1.md": [
        "# Bar",
      ].join("\n"),
    });

    const project = await getBmadProject(REPO, provider);
    expect(project!.epics.map((e) => e.id)).toEqual(["1"]);
    expect(project!.epics[0].title).toBe("From single file");
    // Story from the ignored folder shouldn't appear either
    expect(project!.stories).toHaveLength(0);
  });
});
