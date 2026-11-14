import { ProgressRing } from "@/components/shared/progress-ring";
import { ProjectStatsGrid } from "@/components/dashboard/project-stats-grid";
import { EpicsList } from "@/components/dashboard/epics-list";
import { VelocityMetrics } from "@/components/dashboard/velocity-metrics";
import { KeyArtifactsCard } from "@/components/dashboard/key-artifacts-card";
import { GitBranch, Clock, FolderOpen } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { DeleteRepoButton } from "@/components/shared/delete-repo-button";
import { RefreshRepoButton } from "@/components/shared/refresh-repo-button";
import { RepoSettingsModal } from "@/components/shared/repo-settings-modal";
import type { BmadProject, FileTreeNode } from "@/lib/bmad/types";
import type { RepoConfig } from "@/lib/types";
import type { ProjectViewBaseProps } from "./types";

export type ProjectOverviewRepo = Pick<
  RepoConfig,
  "owner" | "name" | "sourceType" | "localPath" | "lastSyncedAt"
>;

interface ProjectOverviewViewProps extends ProjectViewBaseProps {
  project: BmadProject;
  repo: ProjectOverviewRepo;
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

export function ProjectOverviewView({
  project,
  repo,
  basePath,
  mode,
}: ProjectOverviewViewProps) {
  const isOwner = mode === "owner";
  const isLocal = repo.sourceType === "local";
  const planningArtifacts = extractPlanningArtifacts(project.fileTree);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {project.displayName}
            </h1>
            {isOwner && <RefreshRepoButton owner={repo.owner} name={repo.name} />}
            {isOwner && !isLocal && (
              <RepoSettingsModal
                owner={repo.owner}
                name={repo.name}
                currentBranch={project.branch}
              />
            )}
            {isOwner && (
              <DeleteRepoButton
                owner={repo.owner}
                name={repo.name}
                displayName={project.displayName}
              />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            {isLocal ? (
              <>
                <FolderOpen className="h-4 w-4" />
                <span>
                  {isOwner
                    ? (repo.localPath ?? "Local folder")
                    : "Local folder"}
                </span>
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4" />
                <span>
                  {project.owner}/{project.repo} ({project.branch})
                </span>
              </>
            )}
            {repo.lastSyncedAt && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <Clock className="h-3.5 w-3.5" />
                <span>{formatRelativeTime(repo.lastSyncedAt)}</span>
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
        basePath={basePath}
      />

      {/* Epics list */}
      <EpicsList epics={project.epics} basePath={basePath} />
    </div>
  );
}
