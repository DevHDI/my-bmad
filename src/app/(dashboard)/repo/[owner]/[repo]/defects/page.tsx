import { redirect, notFound } from "next/navigation";
import { getCachedBmadProject } from "@/lib/bmad/cached-project";
import { getGitHubToken } from "@/lib/github/client";
import { DefectsView } from "@/components/defects/defects-view";
import {
  getAuthenticatedUserId,
  getAuthenticatedRepoConfig,
} from "@/lib/db/helpers";

interface DefectsPageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export default async function DefectsPage({ params }: DefectsPageProps) {
  const { owner, repo: repoName } = await params;
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const repoConfig = await getAuthenticatedRepoConfig(userId, owner, repoName);
  if (!repoConfig) return notFound();

  const isLocal = repoConfig.sourceType === "local";
  const token = isLocal ? undefined : (await getGitHubToken(userId)) ?? undefined;
  const project = await getCachedBmadProject(repoConfig, token, userId);
  if (!project) return notFound();

  const openDefects = project.defects.filter((d) => d.status === "open" || d.status === "in-progress").length;

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Defects</h1>
        <p className="text-muted-foreground mt-1">
          {project.defects.length} total &mdash; {openDefects} open
        </p>
      </div>
      <DefectsView defects={project.defects} />
    </div>
  );
}
