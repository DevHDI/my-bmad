import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, SeverityBadge } from "@/components/shared/status-badge";
import { MarkdownRenderer } from "@/components/docs/markdown-renderer";
import { CheckCircle2, Circle, Bug } from "lucide-react";
import { SegmentedProgressBar } from "@/components/shared/segmented-progress-bar";
import type { Defect, StoryDetail } from "@/lib/bmad/types";

interface StoryDetailViewProps {
  story: StoryDetail;
  defects?: Defect[];
}

export function StoryDetailView({ story, defects = [] }: StoryDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            Story {story.id}
          </span>
          <h3 className="text-lg font-semibold">{story.title}</h3>
        </div>
        <StatusBadge status={story.status} />
      </div>

      {/* Description */}
      {story.description && (
        <Card className="glass-card">
          <CardContent className="p-5">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Description
            </h4>
            <MarkdownRenderer content={story.description} />
          </CardContent>
        </Card>
      )}

      {/* Acceptance Criteria */}
      {story.acceptanceCriteria.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-5">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Acceptance Criteria
            </h4>
            <ul className="space-y-2">
              {story.acceptanceCriteria.map((criterion, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-muted-foreground">•</span>
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      {story.tasks.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Tasks
              </h4>
              <span className="text-xs text-muted-foreground">
                {story.completedTasks} of {story.totalTasks} completed
              </span>
            </div>
            <SegmentedProgressBar
              percent={story.totalTasks > 0 ? Math.round((story.completedTasks / story.totalTasks) * 100) : 0}
              color={story.completedTasks === story.totalTasks ? "bg-success" : "bg-warning"}
              className="h-2 mb-4"
            />
            <ul className="space-y-2">
              {story.tasks.map((task, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {task.completed ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <span className={task.completed ? "text-muted-foreground line-through" : ""}>
                    {task.description}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {/* Defects */}
      {defects.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bug className="h-4 w-4 text-destructive" />
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Defects ({defects.length})
              </h4>
            </div>
            <ul className="space-y-3">
              {defects.map((defect) => (
                <li key={defect.id} className="flex items-start justify-between gap-3 rounded-md border border-border/50 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{defect.id}</span>
                      <span className="text-sm font-medium truncate">{defect.title}</span>
                    </div>
                    {defect.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{defect.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <SeverityBadge severity={defect.severity} compact />
                    <StatusBadge status={defect.status} compact />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
