"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SegmentedProgressBar } from "@/components/shared/segmented-progress-bar";
import { StoryDetailView } from "./story-detail-view";
import { ArrowLeft } from "lucide-react";
import type { Epic, StoryDetail } from "@/lib/bmad/types";

interface EpicStoriesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  epic: Epic | null;
  stories: StoryDetail[];
}

export function EpicStoriesSheet({
  open,
  onOpenChange,
  epic,
  stories,
}: EpicStoriesSheetProps) {
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  // Reset internal navigation when the targeted epic changes (covers both
  // "open with a different epic" and "close then reopen") — derived from
  // props at render time, per React 19 guidance.
  const [trackedEpicId, setTrackedEpicId] = useState<string | null | undefined>(
    epic?.id,
  );
  if (trackedEpicId !== epic?.id) {
    setTrackedEpicId(epic?.id);
    setSelectedStoryId(null);
  }
  const selectedStory =
    stories.find((s) => s.id === selectedStoryId) ?? null;

  if (!epic) return null;

  const inDetailView = selectedStory !== null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader className="border-b">
          {inDetailView && selectedStory ? (
            <>
              {/* SheetTitle stays mounted for the Radix Dialog accessible
                  name; the visible header in StoryDetailView already
                  displays the same information for sighted users. */}
              <SheetTitle className="sr-only">
                Story {selectedStory.id}: {selectedStory.title}
              </SheetTitle>
              <button
                type="button"
                onClick={() => setSelectedStoryId(null)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                aria-label="Back to stories list"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to stories
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                  {epic.id}
                </span>
                <SheetTitle className="text-lg">{epic.title}</SheetTitle>
              </div>
              {epic.description && (
                <SheetDescription className="ml-11">
                  {epic.description}
                </SheetDescription>
              )}
              <div className="ml-11 mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {epic.completedStories}/{epic.totalStories} stories
                  </span>
                  <span>{epic.progressPercent}%</span>
                </div>
                <SegmentedProgressBar
                  percent={epic.progressPercent}
                  color={
                    epic.progressPercent >= 100
                      ? "bg-success"
                      : epic.progressPercent > 0
                        ? "bg-info"
                        : "bg-muted-foreground"
                  }
                  className="h-1.5"
                />
              </div>
            </>
          )}
        </SheetHeader>

        <div className="px-4 pb-4">
          {inDetailView && selectedStory ? (
            <StoryDetailView story={selectedStory} />
          ) : stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No story found for this epic
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {stories.map((story) => (
                <Card
                  key={story.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedStoryId(story.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedStoryId(story.id);
                    }
                  }}
                  className="glass-card cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
                  aria-label={`Open story ${story.id}: ${story.title}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                          {story.id}
                        </span>
                        <span className="font-medium text-sm truncate">
                          {story.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {story.totalTasks > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {story.completedTasks}/{story.totalTasks}
                          </span>
                        )}
                        <StatusBadge status={story.status} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
