import { redirect, notFound } from "next/navigation";
import { getCachedBmadProject } from "@/lib/bmad/cached-project";
import { getGitHubToken } from "@/lib/github/client";
import { StoryDetailView } from "@/components/epics/story-detail-view";
import {
  getAuthenticatedUserId,
  getAuthenticatedRepoConfig,
} from "@/lib/db/helpers";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";

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

  const storiesUrl = `/repo/${owner}/${repoName}/stories`;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={storiesUrl}>
            <ChevronLeft className="size-4" />
            <span className="sr-only">Back to stories</span>
          </Link>
        </Button>
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{story.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              Story {story.id}
            </span>
            <StatusBadge status={story.status} />
            {story.epicTitle && (
              <span className="text-sm text-muted-foreground">{story.epicTitle}</span>
            )}
          </div>
        </div>
      </div>
      <StoryDetailView story={story} showHeader={false} />
    </div>
  );
}
