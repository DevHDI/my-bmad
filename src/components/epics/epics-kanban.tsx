"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { SegmentedProgressBar } from "@/components/shared/segmented-progress-bar";
import { StaggeredList, StaggeredItem } from "@/components/shared/staggered-list";
import type { Epic, EpicStatus } from "@/lib/bmad/types";

const kanbanColumns: { status: EpicStatus; label: string; color: string }[] = [
  { status: "not-started", label: "Planning", color: "bg-muted-foreground" },
  { status: "in-progress", label: "In Progress", color: "bg-info" },
  { status: "done", label: "Done", color: "bg-success" },
];

interface EpicsKanbanProps {
  epics: Epic[];
  onSelectEpic: (epicId: string) => void;
}

export function EpicsKanban({ epics, onSelectEpic }: EpicsKanbanProps) {
  if (epics.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-border/50 text-muted-foreground">
        No epic found in this project
      </div>
    );
  }

  return (
    <StaggeredList className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {kanbanColumns.map((col) => {
        const columnEpics = epics.filter((e) => e.status === col.status);
        return (
          <StaggeredItem key={col.status} className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${col.color}`}
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {columnEpics.length}
              </Badge>
            </div>

            <div className="space-y-2 min-h-25">
              {columnEpics.map((epic) => (
                <Card
                  key={epic.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectEpic(epic.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectEpic(epic.id);
                    }
                  }}
                  className="glass-card cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
                  aria-label={`Open epic ${epic.id}: ${epic.title}`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                          {epic.id}
                        </span>
                        <span className="font-medium text-sm leading-tight truncate">
                          {epic.title}
                        </span>
                      </div>
                      <StatusBadge status={epic.status} />
                    </div>

                    <div className="space-y-1.5">
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
                  </CardContent>
                </Card>
              ))}

              {columnEpics.length === 0 && (
                <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground">
                  No epics
                </div>
              )}
            </div>
          </StaggeredItem>
        );
      })}
    </StaggeredList>
  );
}
