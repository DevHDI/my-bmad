import { redirect, notFound } from "next/navigation";
import { getCachedBmadProject } from "@/lib/bmad/cached-project";
import { getGitHubToken } from "@/lib/github/client";
import { StoriesView } from "@/components/stories/stories-view";
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

  const token = await getGitHubToken(userId);
  const project = await getCachedBmadProject(repoConfig, token ?? undefined, userId);
  if (!project) return notFound();

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stories</h1>
        <p className="text-muted-foreground mt-1">
          {project.stories.length} stories across {project.epics.length}{" "}
          epics
        </p>
      </div>
      <StoriesView stories={project.stories} epics={project.epics} />
    </div>
  );
}
