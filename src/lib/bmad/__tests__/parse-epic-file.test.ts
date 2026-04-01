import { describe, it, expect } from "vitest";
import { parseEpicFile } from "../parse-epic-file";

describe("parseEpicFile", () => {
  it("returns null for empty content with non-matching filename", () => {
    expect(parseEpicFile("", "readme.md")).toBeNull();
  });

  it("parses epic from frontmatter", () => {
    const content = `---
id: 1
title: Project Setup
---

This epic handles initial project configuration.
- Story 1.1 - Initialize repo
- Story 1.2 - Setup CI/CD
`;
    const epic = parseEpicFile(content, "epic-1.md");
    expect(epic).not.toBeNull();
    expect(epic!.id).toBe("1");
    expect(epic!.title).toBe("Project Setup");
    expect(epic!.stories).toEqual(["1.1", "1.2"]);
    expect(epic!.totalStories).toBe(2);
    expect(epic!.status).toBe("not-started");
  });

  it("parses epic from heading when no frontmatter", () => {
    const content = `## Epic 2: Authentication System

Implement user authentication.
- Story 2.1 - Login page
- Story 2.2 - JWT tokens
`;
    const epic = parseEpicFile(content, "epic-2.md");
    expect(epic).not.toBeNull();
    expect(epic!.id).toBe("2");
    expect(epic!.title).toBe("Authentication System");
    expect(epic!.stories).toEqual(["2.1", "2.2"]);
  });

  it("extracts id from filename when no frontmatter or heading", () => {
    const content = `# Dashboard Feature

Build the main dashboard.
- Story 3.1 - Layout
`;
    const epic = parseEpicFile(content, "3-dashboard-feature.md");
    expect(epic).not.toBeNull();
    expect(epic!.id).toBe("3");
    expect(epic!.title).toBe("Dashboard Feature");
    expect(epic!.stories).toEqual(["3.1"]);
  });

  it("extracts id from filename pattern epic_N.md", () => {
    const epic = parseEpicFile("Some content", "epic_4.md");
    expect(epic).not.toBeNull();
    expect(epic!.id).toBe("4");
  });

  it("extracts id from simple numeric filename", () => {
    const content = `---
title: Simple Epic
---
- Story 5.1 - Task A
`;
    const epic = parseEpicFile(content, "5.md");
    expect(epic).not.toBeNull();
    expect(epic!.id).toBe("5");
    expect(epic!.title).toBe("Simple Epic");
  });

  it("frontmatter id takes priority over heading and filename", () => {
    const content = `---
id: 10
title: Frontmatter Title
---

## Epic 99: Heading Title
`;
    const epic = parseEpicFile(content, "epic-50.md");
    expect(epic).not.toBeNull();
    expect(epic!.id).toBe("10");
    expect(epic!.title).toBe("Frontmatter Title");
  });

  it("deduplicates story references", () => {
    const content = `---
id: 1
title: Test
---
- Story 1.1 - First
- Story 1.1 - Duplicate
- S 1.2 - Another
`;
    const epic = parseEpicFile(content, "epic-1.md");
    expect(epic!.stories).toEqual(["1.1", "1.2"]);
  });

  it("truncates description to 500 characters", () => {
    const longDesc = "A".repeat(600);
    const content = `---
id: 1
title: Long
---
${longDesc}`;
    const epic = parseEpicFile(content, "epic-1.md");
    expect(epic!.description.length).toBeLessThanOrEqual(500);
  });

  it("handles H1 title fallback with epic prefix stripped", () => {
    const content = `# Epic 7: Payment System

Process payments securely.
`;
    const epic = parseEpicFile(content, "7-payment.md");
    expect(epic).not.toBeNull();
    expect(epic!.id).toBe("7");
    expect(epic!.title).toBe("Payment System");
  });

  it("falls back to 'Epic N' title when no title found", () => {
    const content = `Some description without any heading.`;
    const epic = parseEpicFile(content, "epic-6.md");
    expect(epic).not.toBeNull();
    expect(epic!.id).toBe("6");
    expect(epic!.title).toBe("Epic 6");
  });

  it("handles S shorthand for story references", () => {
    const content = `---
id: 1
title: Test
---
- S 1.1 - First
- S1.2 - Second
- S-1.3 - Third
`;
    const epic = parseEpicFile(content, "epic-1.md");
    expect(epic!.stories).toEqual(["1.1", "1.2", "1.3"]);
  });
});
