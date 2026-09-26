import { redirect, notFound } from "next/navigation";
import { getCachedBmadProject } from "@/lib/bmad/cached-project";
import { getGitHubToken } from "@/lib/github/client";
import { ProjectStoryDetailView } from "@/components/project-views/project-story-detail-view";
import {
  getAuthenticatedUserId,
  getAuthenticatedRepoConfig,
} from "@/lib/db/helpers";

interface StoryPageProps {
  params: Promise<{ owner: string; repo: string; storyId: string }>;
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { owner, repo: repoName, storyId } = await params;
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const repoConfig = await getAuthenticatedRepoConfig(userId, owner, repoName);
  if (!repoConfig) return notFound();

  const isLocal = repoConfig.sourceType === "local";
  const token = isLocal ? undefined : (await getGitHubToken(userId)) ?? undefined;
  const project = await getCachedBmadProject(repoConfig, token, userId);
  if (!project) return notFound();

  const story = project.stories.find((s) => s.id === storyId);
  if (!story) return notFound();

  return (
    <ProjectStoryDetailView
      story={story}
      basePath={`/repo/${owner}/${repoName}`}
      mode="owner"
    />
  );
}
