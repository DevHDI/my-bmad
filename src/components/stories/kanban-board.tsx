"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StaggeredList, StaggeredItem } from "@/components/shared/staggered-list";
import type { StoryDetail, StoryStatus } from "@/lib/bmad/types";
import { getStoryShortId } from "@/lib/bmad/utils";

const kanbanColumns: { status: StoryStatus; label: string; color: string }[] = [
  { status: "backlog", label: "Backlog", color: "bg-muted-foreground" },
  { status: "ready-for-dev", label: "Ready for Dev", color: "bg-purple-500" },
  { status: "in-progress", label: "In Progress", color: "bg-info" },
  { status: "review", label: "In Review", color: "bg-warning" },
  { status: "blocked", label: "Blocked", color: "bg-destructive" },
  { status: "done", label: "Done", color: "bg-success" },
];

interface KanbanBoardProps {
  stories: StoryDetail[];
}

export function KanbanBoard({ stories }: KanbanBoardProps) {
  if (stories.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-border/50 text-muted-foreground">
        No story matches the filters
      </div>
    );
  }

  return (
    <StaggeredList className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {kanbanColumns.map((col) => {
        const columnStories = stories.filter(
          (s) =>
            s.status === col.status ||
            (col.status === "backlog" && s.status === "unknown")
        );
        return (
          <StaggeredItem key={col.status} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} aria-hidden="true" />
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {columnStories.length}
              </Badge>
            </div>
            <div className="space-y-2 min-h-25">
              {columnStories.map((story) => (
                <Card
                  key={story.id}
                  className="glass-card hover:shadow-sm transition-shadow duration-300"
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-sm leading-tight">
                        {story.title}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground shrink-0" title={story.id}>
                        S{getStoryShortId(story.id)}
                      </span>
                    </div>
                    {story.epicTitle && (
                      <p className="text-xs text-muted-foreground">
                        {story.epicTitle}
                      </p>
                    )}
                    {story.totalTasks > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Tasks</span>
                          <span>
                            {story.completedTasks}/{story.totalTasks}
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{
                              width: `${
                                (story.completedTasks / story.totalTasks) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {columnStories.length === 0 && (
                <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground">
                  No stories
                </div>
              )}
            </div>
          </StaggeredItem>
        );
      })}
    </StaggeredList>
  );
}
