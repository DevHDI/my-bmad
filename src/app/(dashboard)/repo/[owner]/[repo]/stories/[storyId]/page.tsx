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
      <div className="flex items-center gap-4">
        <Link href={storiesUrl}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to stories</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{story.title}</h1>
          {story.epicTitle && (
            <p className="text-muted-foreground mt-1">{story.epicTitle}</p>
          )}
        </div>
      </div>
      <StoryDetailView story={story} />
    </div>
  );
}
