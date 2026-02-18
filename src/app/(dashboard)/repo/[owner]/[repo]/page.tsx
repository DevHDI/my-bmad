import { redirect, notFound } from "next/navigation";
import { getCachedBmadProject } from "@/lib/bmad/cached-project";
import { getGitHubToken } from "@/lib/github/client";
import { ProgressRing } from "@/components/shared/progress-ring";
import { ProjectStatsGrid } from "@/components/dashboard/project-stats-grid";
import { EpicsList } from "@/components/dashboard/epics-list";
import { VelocityMetrics } from "@/components/dashboard/velocity-metrics";
import { KeyArtifactsCard } from "@/components/dashboard/key-artifacts-card";
import { GitBranch, Clock } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { DeleteRepoButton } from "@/components/shared/delete-repo-button";
import { RefreshRepoButton } from "@/components/shared/refresh-repo-button";
import {
  getAuthenticatedUserId,
  getAuthenticatedRepoConfig,
} from "@/lib/db/helpers";
import type { FileTreeNode } from "@/lib/bmad/types";

interface RepoPageProps {
  params: Promise<{ owner: string; repo: string }>;
}

function extractPlanningArtifacts(fileTree: FileTreeNode[]): FileTreeNode[] {
  const planningDir = fileTree.find(
    (node) =>
      node.type === "directory" &&
      node.name.toLowerCase().includes("planning-artifacts"),
  );
  return planningDir?.children ?? [];
}

function getSprintProgress(project: {
  sprintStatus: { stories: { status: string }[] } | null;
}): number | null {
  if (!project.sprintStatus) return null;
  const stories = project.sprintStatus.stories;
  if (stories.length === 0) return null;
  const done = stories.filter((s) => s.status === "done").length;
  return Math.round((done / stories.length) * 100);
}

export default async function RepoOverviewPage({ params }: RepoPageProps) {
  const { owner, repo: repoName } = await params;
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const repoConfig = await getAuthenticatedRepoConfig(userId, owner, repoName);
  if (!repoConfig) return notFound();

  const token = await getGitHubToken(userId);
  const project = await getCachedBmadProject(repoConfig, token ?? undefined, userId);
  if (!project) return notFound();

  const planningArtifacts = extractPlanningArtifacts(project.fileTree);

  return (
    <div className="space-y-8 pb-8">
      {/* Header : nom, refresh, delete, branche, synchro */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {project.displayName}
            </h1>
            <RefreshRepoButton owner={owner} name={repoName} />
            <DeleteRepoButton
              owner={owner}
              name={repoName}
              displayName={project.displayName}
            />
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <GitBranch className="h-4 w-4" />
            <span>
              {project.owner}/{project.repo} ({project.branch})
            </span>
            {repoConfig.lastSyncedAt && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <Clock className="h-3.5 w-3.5" />
                <span>{formatRelativeTime(repoConfig.lastSyncedAt)}</span>
              </>
            )}
          </div>
        </div>
        <ProgressRing
          percent={project.progressPercent}
          size={72}
          strokeWidth={5}
        />
      </div>

      {/* 4 Stats Cards en grille */}
      <ProjectStatsGrid
        totalEpics={project.epics.length}
        totalStories={project.totalStories}
        completedStories={project.completedStories}
        sprintProgress={getSprintProgress(project)}
      />

      {/* Velocity metrics */}
      {project.sprintStatus && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Velocity Metrics</h2>
          <VelocityMetrics sprintStatus={project.sprintStatus} />
        </section>
      )}

      {/* Key documents */}
      <KeyArtifactsCard
        planningArtifacts={planningArtifacts}
        owner={owner}
        repo={repoName}
      />

      {/* Liste des Epics */}
      <EpicsList epics={project.epics} owner={owner} repo={repoName} />
    </div>
  );
}
