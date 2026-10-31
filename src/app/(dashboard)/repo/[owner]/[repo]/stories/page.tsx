import { redirect, notFound } from "next/navigation";
import { getCachedBmadProject } from "@/lib/bmad/cached-project";
import { getGitHubToken } from "@/lib/github/client";
import { ProjectStoriesView } from "@/components/project-views/project-stories-view";
import {
  getAuthenticatedUserId,
  getAuthenticatedRepoConfig,
} from "@/lib/db/helpers";

interface StoriesPageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export default async function StoriesPage({ params }: StoriesPageProps) {
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
    <ProjectStoriesView
      project={project}
      basePath={`/repo/${owner}/${repoName}`}
      mode="owner"
    />
  );
}
