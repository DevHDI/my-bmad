import { redirect, notFound } from "next/navigation";
import { getCachedBmadProject } from "@/lib/bmad/cached-project";
import { getGitHubToken } from "@/lib/github/client";
import { EpicsBrowser } from "@/components/epics/epics-browser";
import {
  getAuthenticatedUserId,
  getAuthenticatedRepoConfig,
} from "@/lib/db/helpers";

interface EpicsPageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export default async function EpicsPage({ params }: EpicsPageProps) {
  const { owner, repo: repoName } = await params;
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const repoConfig = await getAuthenticatedRepoConfig(userId, owner, repoName);
  if (!repoConfig) return notFound();

  const token = await getGitHubToken(userId);
  const project = await getCachedBmadProject(repoConfig, token ?? undefined, userId);
  if (!project) return notFound();

  const totalEpicProgress = project.epics.length > 0
    ? Math.round(
        project.epics.reduce((sum, e) => sum + e.progressPercent, 0) /
          project.epics.length
      )
    : 0;

  return (
    <EpicsBrowser
      epics={project.epics}
      stories={project.stories}
      totalEpics={project.epics.length}
      totalStories={project.totalStories}
      totalEpicProgress={totalEpicProgress}
    />
  );
}
