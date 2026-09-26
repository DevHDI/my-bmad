import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { BmadProject, FileTreeNode, StoryDetail } from "@/lib/bmad/types";
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ProjectOverviewView,
  type ProjectOverviewRepo,
} from "@/components/project-views/project-overview-view";
import { ProjectEpicsView } from "@/components/project-views/project-epics-view";
import { ProjectStoriesView } from "@/components/project-views/project-stories-view";
import { ProjectStoryDetailView } from "@/components/project-views/project-story-detail-view";
import { ProjectDocsView } from "@/components/project-views/project-docs-view";

// Server actions pull Prisma and the GitHub client: views must never call them
// while rendering, so a stub is enough.
vi.mock("@/actions/repo-actions", () => ({
  refreshRepoData: vi.fn(),
  deleteRepo: vi.fn(),
  listRepoBranches: vi.fn(),
  updateRepoBranch: vi.fn(),
  fetchParsedFileContent: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/shared/abc/stories",
}));

/** Renders under the providers the dashboard layouts supply. */
function render(node: ReactNode): string {
  return renderToStaticMarkup(
    <TooltipProvider>
      <BreadcrumbProvider>{node}</BreadcrumbProvider>
    </TooltipProvider>,
  );
}

const story: StoryDetail = {
  id: "1.1",
  title: "Login form",
  status: "in-progress",
  epicId: "1",
  epicTitle: "Authentication",
  description: "As a user I want to log in.",
  acceptanceCriteria: ["Given a valid email, the user is logged in"],
  tasks: [{ description: "Build the form", completed: true }],
  completedTasks: 1,
  totalTasks: 1,
};

const planningDoc: FileTreeNode = {
  name: "prd.md",
  path: "_bmad-output/planning-artifacts/prd.md",
  type: "file",
};

const project: BmadProject = {
  owner: "octo",
  repo: "app",
  branch: "main",
  displayName: "Octo App",
  sprintStatus: null,
  epics: [
    {
      id: "1",
      title: "Authentication",
      description: "",
      status: "in-progress",
      stories: ["1.1"],
      totalStories: 1,
      completedStories: 0,
      progressPercent: 0,
    },
  ],
  stories: [story],
  fileTree: [
    {
      name: "planning-artifacts",
      path: "_bmad-output/planning-artifacts",
      type: "directory",
      children: [planningDoc],
    },
  ],
  bmadFiles: [],
  docsTree: [],
  docsFolderName: null,
  totalStories: 1,
  completedStories: 0,
  inProgressStories: 1,
  progressPercent: 0,
};

const githubRepo: ProjectOverviewRepo = {
  owner: "octo",
  name: "app",
  sourceType: "github",
  localPath: null,
  lastSyncedAt: null,
};

const localRepo: ProjectOverviewRepo = {
  owner: "local",
  name: "app",
  sourceType: "local",
  localPath: "/Users/dev/secret-client/app",
  lastSyncedAt: null,
};

const REFRESH = 'aria-label="Refresh data"';
const SETTINGS = 'aria-label="Project settings"';
const DELETE = 'aria-label="Remove project"';

const ownerBase = "/repo/octo/app";
const guestBase = "/shared/abc";

describe("ProjectOverviewView", () => {
  it("owner + GitHub project: refresh, settings and delete actions, /repo links", () => {
    const html = render(
      <ProjectOverviewView project={project} repo={githubRepo} basePath={ownerBase} mode="owner" />,
    );

    expect(html).toContain(REFRESH);
    expect(html).toContain(SETTINGS);
    expect(html).toContain(DELETE);
    expect(html).toContain("octo/app (main)");
    expect(html).toContain(`href="${ownerBase}/epics"`);
    expect(html).toContain(
      `href="${ownerBase}/docs?file=${encodeURIComponent(planningDoc.path)}"`,
    );
  });

  it("owner + local project: local path shown, no branch settings", () => {
    const html = render(
      <ProjectOverviewView project={project} repo={localRepo} basePath="/repo/local/app" mode="owner" />,
    );

    expect(html).toContain("/Users/dev/secret-client/app");
    expect(html).toContain(REFRESH);
    expect(html).toContain(DELETE);
    expect(html).not.toContain(SETTINGS);
  });

  it("guest: no modification action, no local path, links built from basePath", () => {
    const githubHtml = render(
      <ProjectOverviewView project={project} repo={githubRepo} basePath={guestBase} mode="guest" />,
    );
    const localHtml = render(
      <ProjectOverviewView project={project} repo={localRepo} basePath={guestBase} mode="guest" />,
    );

    for (const html of [githubHtml, localHtml]) {
      expect(html).not.toContain(REFRESH);
      expect(html).not.toContain(SETTINGS);
      expect(html).not.toContain(DELETE);
      expect(html).not.toContain("/repo/");
      expect(html).toContain(`href="${guestBase}/epics"`);
      expect(html).toContain(`href="${guestBase}/docs?file=`);
    }
    expect(localHtml).not.toContain("secret-client");
    expect(localHtml).toContain("Local folder");
  });
});

describe("ProjectStoryDetailView", () => {
  it.each([
    { mode: "owner" as const, basePath: ownerBase },
    { mode: "guest" as const, basePath: guestBase },
  ])("$mode: links back to $basePath/stories", ({ mode, basePath }) => {
    const html = render(
      <ProjectStoryDetailView story={story} basePath={basePath} mode={mode} />,
    );

    expect(html).toContain(`href="${basePath}/stories"`);
    expect(html).toContain("Back to stories");
    expect(html).toContain("Login form");
    expect(html).toContain("Story 1.1");
  });
});

describe("ProjectStoriesView and ProjectEpicsView", () => {
  it("render the project data, story links follow the current pathname", () => {
    const stories = render(
      <ProjectStoriesView project={project} basePath={guestBase} mode="guest" />,
    );
    const epics = render(
      <ProjectEpicsView project={project} basePath={guestBase} mode="guest" />,
    );

    expect(stories).toContain("1 stories across 1");
    // pathname is mocked to `${guestBase}/stories`
    expect(stories).toContain(`href="${guestBase}/stories/1.1"`);
    expect(epics).toContain("Authentication");
  });
});

describe("ProjectDocsView", () => {
  const files = {
    fileTree: [planningDoc],
    docsTree: [],
    bmadCoreTree: [
      { name: "config.yaml", path: "_bmad/core/config.yaml", type: "file" as const },
    ],
  };
  const source = { kind: "owner" as const, owner: "octo", repo: "app" };

  it("owner: shows the BMAD core tree", () => {
    const html = render(
      <ProjectDocsView basePath={ownerBase} mode="owner" source={source} files={files} />,
    );

    expect(html).toContain("Library");
    expect(html).toContain("BMAD Configuration");
    expect(html).toContain("config.yaml");
  });

  it("guest: hides the BMAD core tree", () => {
    const html = render(
      <ProjectDocsView basePath={guestBase} mode="guest" source={source} files={files} />,
    );

    expect(html).toContain("prd.md");
    expect(html).not.toContain("BMAD Configuration");
    expect(html).not.toContain("config.yaml");
  });

  it("guest: a BMAD core file passed as initialSelectedFile is not preselected", () => {
    const html = render(
      <ProjectDocsView
        basePath={guestBase}
        mode="guest"
        source={source}
        files={files}
        initialSelectedFile="_bmad/core/config.yaml"
      />,
    );

    expect(html).not.toContain("_bmad/core/config.yaml");
    expect(html).not.toContain("config.yaml");
    expect(html).not.toContain("Loading...");
    expect(html).toContain("Select a file from the tree to view its content");
  });

  it("owner: forwards initialSelectedFile (file preselected and loading)", () => {
    const html = render(
      <ProjectDocsView
        basePath={ownerBase}
        mode="owner"
        source={source}
        files={files}
        initialSelectedFile={planningDoc.path}
      />,
    );

    expect(html).toContain("Loading...");
    expect(html).not.toContain("Select a file from the tree to view its content");
  });

  it("shows the loading error under the Library header", () => {
    const html = render(
      <ProjectDocsView basePath={ownerBase} mode="owner" source={source} error="Repository not found" />,
    );

    expect(html).toContain("Library");
    expect(html).toContain('role="alert"');
    expect(html).toContain("Repository not found");
  });
});

describe("loadParsedFile", () => {
  it("owner source: loads through fetchParsedFileContent and passes its errors through", async () => {
    const { fetchParsedFileContent } = await import("@/actions/repo-actions");
    const { loadParsedFile } = await import("@/components/docs/docs-browser");
    const failure = { success: false as const, error: "File not found", code: "NOT_FOUND" };
    vi.mocked(fetchParsedFileContent).mockResolvedValueOnce(failure);

    const result = await loadParsedFile(
      { kind: "owner", owner: "octo", repo: "app" },
      "docs/prd.md",
    );

    expect(fetchParsedFileContent).toHaveBeenCalledWith({
      owner: "octo",
      name: "app",
      path: "docs/prd.md",
    });
    expect(result).toEqual(failure);
  });
});
