"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProgressRing } from "@/components/shared/progress-ring";
import { SegmentedProgressBar } from "@/components/shared/segmented-progress-bar";
import { EpicsTimeline } from "./epics-timeline";
import { EpicsKanban } from "./epics-kanban";
import { EpicStoriesSheet } from "./epic-stories-sheet";
import { StoryDetailView } from "./story-detail-view";
import { useBreadcrumb } from "@/contexts/breadcrumb-context";
import { ArrowLeft, GanttChartSquare, Columns3 } from "lucide-react";
import type { Epic, StoryDetail } from "@/lib/bmad/types";

type EpicsLayout = "timeline" | "kanban";

type View = "epics" | "stories" | "story";

interface EpicsBrowserProps {
  epics: Epic[];
  stories: StoryDetail[];
  totalEpics: number;
  totalStories: number;
  totalEpicProgress: number;
}

export function EpicsBrowser({
  epics,
  stories,
  totalEpics,
  totalStories,
  totalEpicProgress,
}: EpicsBrowserProps) {
  const [view, setView] = useState<View>("epics");
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [layout, setLayout] = useState<EpicsLayout>("timeline");
  const [sheetEpicId, setSheetEpicId] = useState<string | null>(null);
  const { setExtraSegments, clearExtraSegments } = useBreadcrumb();

  const sheetEpic = useMemo(
    () => epics.find((e) => e.id === sheetEpicId) ?? null,
    [epics, sheetEpicId],
  );

  const sheetEpicStories = useMemo(
    () => (sheetEpicId ? stories.filter((s) => s.epicId === sheetEpicId) : []),
    [stories, sheetEpicId],
  );

  const openEpicSheet = useCallback((epicId: string) => {
    setSheetEpicId(epicId);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    if (!open) setSheetEpicId(null);
  }, []);

  const selectedEpic = useMemo(
    () => epics.find((e) => e.id === selectedEpicId) ?? null,
    [epics, selectedEpicId],
  );

  const epicStories = useMemo(
    () =>
      selectedEpicId ? stories.filter((s) => s.epicId === selectedEpicId) : [],
    [stories, selectedEpicId],
  );

  const selectedStory = useMemo(
    () => stories.find((s) => s.id === selectedStoryId) ?? null,
    [stories, selectedStoryId],
  );

  const goToEpics = useCallback(() => {
    setView("epics");
    setSelectedEpicId(null);
    setSelectedStoryId(null);
  }, []);

  const goToStories = useCallback((epicId: string) => {
    setView("stories");
    setSelectedEpicId(epicId);
    setSelectedStoryId(null);
  }, []);

  const goToStory = useCallback((storyId: string) => {
    setView("story");
    setSelectedStoryId(storyId);
  }, []);

  // Listen for section-reset event from sidebar to reset to epics list
  useEffect(() => {
    const handleReset = () => goToEpics();
    window.addEventListener("section-reset", handleReset);
    return () => window.removeEventListener("section-reset", handleReset);
  }, [goToEpics]);

  // Sync breadcrumb context with internal navigation state
  useEffect(() => {
    const segments: { label: string; onClick?: () => void }[] = [];

    if (view === "epics") {
      // No extra segment — header already shows "Epics"
    } else if (view === "stories" && selectedEpic) {
      segments.push({ label: "Epics", onClick: goToEpics });
      segments.push({
        label: `Epic ${selectedEpic.id}`,
      });
    } else if (view === "story" && selectedEpic) {
      segments.push({ label: "Epics", onClick: goToEpics });
      segments.push({
        label: `Epic ${selectedEpic.id}`,
        onClick: () => goToStories(selectedEpic.id),
      });
      if (selectedStory) {
        segments.push({
          label: `Story ${selectedStory.id}`,
        });
      }
    }

    if (segments.length > 0) {
      setExtraSegments(segments);
    } else {
      clearExtraSegments();
    }
  }, [
    view,
    selectedEpic,
    selectedStory,
    setExtraSegments,
    clearExtraSegments,
    goToEpics,
    goToStories,
  ]);

  // Clear extra segments when unmounting
  useEffect(() => {
    return () => clearExtraSegments();
  }, [clearExtraSegments]);

  // Dynamic title based on current view
  const renderTitle = () => {
    if (view === "epics") {
      return (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Epics</h1>
            <p className="text-muted-foreground mt-1">
              {totalEpics} epics &middot; {totalStories} stories
            </p>
          </div>
          <ProgressRing percent={totalEpicProgress} size={56} strokeWidth={4} />
        </div>
      );
    }

    if ((view === "stories" || view === "story") && selectedEpic) {
      return (
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Epic {selectedEpic.id}: {selectedEpic.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {epicStories.length} stories
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8 pb-8">
      {renderTitle()}

      {/* Back button */}
      {view !== "epics" && (
        <button
          type="button"
          onClick={
            view === "story" && selectedEpic
              ? () => goToStories(selectedEpic.id)
              : goToEpics
          }
          aria-label={view === "story" ? "Back to stories" : "Back to epics"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
        >
          <ArrowLeft className="h-4 w-4" />
          {view === "story" ? "Back to stories" : "Back to epics"}
        </button>
      )}

      <div className="space-y-4">
        {/* Layout toggle (only on the epics list view) */}
        {view === "epics" && (
          <div className="flex justify-end">
            <div
              className="flex gap-1 border rounded-lg p-1"
              role="group"
              aria-label="Epics display mode"
            >
              <Button
                variant={layout === "timeline" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setLayout("timeline")}
                className="gap-1.5"
                aria-label="Timeline view"
                aria-pressed={layout === "timeline"}
              >
                <GanttChartSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Timeline</span>
              </Button>
              <Button
                variant={layout === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setLayout("kanban")}
                className="gap-1.5"
                aria-label="Kanban view"
                aria-pressed={layout === "kanban"}
              >
                <Columns3 className="h-4 w-4" />
                <span className="hidden sm:inline">Board</span>
              </Button>
            </div>
          </div>
        )}

        {/* Active view */}
        {view === "epics" && layout === "timeline" && (
          <EpicsTimeline epics={epics} onSelectEpic={goToStories} />
        )}

        {view === "epics" && layout === "kanban" && (
          <EpicsKanban epics={epics} onSelectEpic={openEpicSheet} />
        )}

        {view === "stories" && selectedEpic && (
          <div className="space-y-4">
            {/* Epic header summary */}
            <Card className="glass-card">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {selectedEpic.id}
                      </span>
                      <h3 className="text-lg font-semibold">
                        {selectedEpic.title}
                      </h3>
                    </div>
                    {selectedEpic.description && (
                      <p className="text-sm text-muted-foreground ml-11">
                        {selectedEpic.description}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={selectedEpic.status} />
                </div>
                <div className="mt-3 ml-11">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>
                      {selectedEpic.completedStories} of{" "}
                      {selectedEpic.totalStories} stories
                    </span>
                    <span>{selectedEpic.progressPercent}%</span>
                  </div>
                  <SegmentedProgressBar
                    percent={selectedEpic.progressPercent}
                    color={
                      selectedEpic.progressPercent >= 100
                        ? "bg-success"
                        : "bg-warning"
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stories list */}
            {epicStories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No story found for this epic
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {epicStories.map((story) => (
                  <Card
                    key={story.id}
                    className="glass-card cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
                    role="button"
                    tabIndex={0}
                    onClick={() => goToStory(story.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goToStory(story.id);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                            {story.id}
                          </span>
                          <span className="font-medium truncate">
                            {story.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {story.totalTasks > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {story.completedTasks}/{story.totalTasks} tasks
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
        )}

        {view === "story" && selectedStory && (
          <StoryDetailView story={selectedStory} />
        )}
      </div>

      <EpicStoriesSheet
        open={sheetEpicId !== null}
        onOpenChange={handleSheetOpenChange}
        epic={sheetEpic}
        stories={sheetEpicStories}
      />
    </div>
  );
}
