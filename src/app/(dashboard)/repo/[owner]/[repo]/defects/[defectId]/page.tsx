import { redirect, notFound } from "next/navigation";
import { getCachedBmadProject } from "@/lib/bmad/cached-project";
import { getGitHubToken } from "@/lib/github/client";
import { DefectDetailView } from "@/components/defects/defect-detail-view";
import {
  getAuthenticatedUserId,
  getAuthenticatedRepoConfig,
} from "@/lib/db/helpers";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DefectPageProps {
  params: Promise<{ owner: string; repo: string; defectId: string }>;
}

export default async function DefectPage({ params }: DefectPageProps) {
  const { owner, repo: repoName, defectId } = await params;
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const repoConfig = await getAuthenticatedRepoConfig(userId, owner, repoName);
  if (!repoConfig) return notFound();

  const isLocal = repoConfig.sourceType === "local";
  const token = isLocal ? undefined : (await getGitHubToken(userId)) ?? undefined;
  const project = await getCachedBmadProject(repoConfig, token, userId);
  if (!project) return notFound();

  const defect = project.defects.find((d) => d.id === defectId);
  if (!defect) return notFound();

  const defectsUrl = `/repo/${owner}/${repoName}/defects`;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center gap-4">
        <Link href={defectsUrl}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to defects</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{defect.title}</h1>
          {defect.epicId && (
            <p className="text-muted-foreground mt-1 uppercase text-sm font-mono">
              Epic {defect.epicId}
            </p>
          )}
        </div>
      </div>
      <DefectDetailView defect={defect} />
    </div>
  );
}
