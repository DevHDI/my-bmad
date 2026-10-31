import { redirect, notFound } from "next/navigation";
import { getCachedBmadProject } from "@/lib/bmad/cached-project";
import { getGitHubToken } from "@/lib/github/client";
import { ProjectOverviewView } from "@/components/project-views/project-overview-view";
import {
  getAuthenticatedUserId,
  getAuthenticatedRepoConfig,
} from "@/lib/db/helpers";

interface RepoPageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export default async function RepoOverviewPage({ params }: RepoPageProps) {
  const { owner, repo: repoName } = await params;
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const repoConfig = await getAuthenticatedRepoConfig(userId, owner, repoName);
  if (!repoConfig) return notFound();

  const isLocal = repoConfig.sourceType === "local";
  const token = isLocal ? undefined : (await getGitHubToken(userId)) ?? undefined;
  const project = await getCachedBmadProject(repoConfig, token, userId);
  if (!project) return notFound();

  return (
    <ProjectOverviewView
      project={project}
      repo={{
        owner,
        name: repoName,
        sourceType: repoConfig.sourceType,
        localPath: repoConfig.localPath,
        lastSyncedAt: repoConfig.lastSyncedAt,
      }}
      basePath={`/repo/${owner}/${repoName}`}
      mode="owner"
    />
  );
}
