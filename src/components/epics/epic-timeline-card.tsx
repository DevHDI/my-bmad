import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SegmentedProgressBar } from "@/components/shared/segmented-progress-bar";
import type { Epic } from "@/lib/bmad/types";
import { getEpicShortId } from "@/lib/bmad/utils";

function getProgressColor(percent: number) {
  return percent >= 100 ? "bg-success" : "bg-warning";
}

interface EpicTimelineCardProps {
  epic: Epic;
  onClick?: () => void;
}

export function EpicTimelineCard({ epic, onClick }: EpicTimelineCardProps) {
  return (
    <Card
      className={`glass-card${onClick ? " cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200" : ""}`}
      onClick={onClick}
      {...(onClick && {
        role: "button" as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        },
      })}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary" title={epic.id}>
                {getEpicShortId(epic)}
              </span>
              <h3 className="font-semibold">{epic.title}</h3>
            </div>
            {epic.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 ml-11">
                {epic.description}
              </p>
            )}
            <div className="ml-11 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>
                    {epic.completedStories} of {epic.totalStories} stories
                  </span>
                  <span>{epic.progressPercent}%</span>
                </div>
                <SegmentedProgressBar
                  percent={epic.progressPercent}
                  color={getProgressColor(epic.progressPercent)}
                  className="h-5"
                />
              </div>
              <StatusBadge status={epic.status} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
