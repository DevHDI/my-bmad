import { describe, it, expect } from "vitest";
import { parseEpicFolderName } from "../parse-epic-folder";

describe("parseEpicFolderName", () => {
  it("parses 'epic-1' as id=1 with empty title", () => {
    expect(parseEpicFolderName("epic-1")).toEqual({ id: "1", title: "" });
  });

  it("parses 'epic_1' (underscore separator)", () => {
    expect(parseEpicFolderName("epic_1")).toEqual({ id: "1", title: "" });
  });

  it("parses bare numeric folder '1'", () => {
    expect(parseEpicFolderName("1")).toEqual({ id: "1", title: "" });
  });

  it("parses 'epic-1-project-foundation' with title-cased title", () => {
    expect(parseEpicFolderName("epic-1-project-foundation")).toEqual({
      id: "1",
      title: "Project Foundation",
    });
  });

  it("parses 'epic_1_project_foundation' (underscores)", () => {
    expect(parseEpicFolderName("epic_1_project_foundation")).toEqual({
      id: "1",
      title: "Project Foundation",
    });
  });

  it("parses '1-project-foundation' without epic prefix", () => {
    expect(parseEpicFolderName("1-project-foundation")).toEqual({
      id: "1",
      title: "Project Foundation",
    });
  });

  it("supports multi-digit ids", () => {
    expect(parseEpicFolderName("epic-12-large-id")).toEqual({
      id: "12",
      title: "Large Id",
    });
  });

  it("collapses multiple consecutive separators", () => {
    expect(parseEpicFolderName("epic-1--double-sep")).toEqual({
      id: "1",
      title: "Double Sep",
    });
  });

  it("is case-insensitive on the prefix", () => {
    expect(parseEpicFolderName("EPIC-1-foo")).toEqual({
      id: "1",
      title: "Foo",
    });
  });

  it("returns null for non-matching folder names", () => {
    expect(parseEpicFolderName("not-an-epic")).toBeNull();
    expect(parseEpicFolderName("foo-1")).toBeNull();
    expect(parseEpicFolderName("")).toBeNull();
    expect(parseEpicFolderName("   ")).toBeNull();
  });
});
