import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/shared/progress-ring";
import { StatusBadge } from "@/components/shared/status-badge";
import { Info, Calendar } from "lucide-react";
import type { SprintStatus, StoryStatus } from "@/lib/bmad/types";

interface SprintSummaryCardProps {
  sprintStatus: SprintStatus | null;
}

const statusOrder: StoryStatus[] = [
  "done",
  "review",
  "in-progress",
  "blocked",
  "backlog",
  "unknown",
];

export function SprintSummaryCard({
  sprintStatus,
}: SprintSummaryCardProps) {
  if (!sprintStatus) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
          <Info className="h-5 w-5 shrink-0" />
          <span>No sprint defined</span>
        </CardContent>
      </Card>
    );
  }

  const sprintStories = sprintStatus.stories;
  const sprintTotal = sprintStories.length;
  const sprintDone = sprintStories.filter((s) => s.status === "done").length;
  const sprintPercent =
    sprintTotal > 0 ? Math.round((sprintDone / sprintTotal) * 100) : 0;

  // Group stories by status
  const byStatus = new Map<StoryStatus, number>();
  for (const story of sprintStories) {
    byStatus.set(story.status, (byStatus.get(story.status) || 0) + 1);
  }

  // Group stories by epic
  const byEpic = new Map<string, { total: number; done: number }>();
  for (const story of sprintStories) {
    const epicKey = story.epicId || "other";
    const entry = byEpic.get(epicKey) || { total: 0, done: 0 };
    entry.total++;
    if (story.status === "done") entry.done++;
    byEpic.set(epicKey, entry);
  }

  // Sort epics numerically
  const sortedEpics = [...byEpic.entries()].sort((a, b) => {
    const numA = parseInt(a[0], 10) || 0;
    const numB = parseInt(b[0], 10) || 0;
    return numA - numB;
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Sprint: {sprintStatus.sprint || "Current"}
          </CardTitle>
          {(sprintStatus.startDate || sprintStatus.endDate) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {sprintStatus.startDate && sprintStatus.endDate
                  ? `${sprintStatus.startDate} → ${sprintStatus.endDate}`
                  : sprintStatus.startDate || sprintStatus.endDate}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overview avec progress ring */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Status: {sprintStatus.status || "Active"}
            </p>
            <p className="text-sm text-muted-foreground">
              {sprintDone}/{sprintTotal} stories completed
            </p>
          </div>
          <ProgressRing percent={sprintPercent} size={64} strokeWidth={5} />
        </div>

        {/* Status breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Status breakdown</p>
          <div className="flex flex-wrap gap-2">
            {statusOrder
              .filter((status) => byStatus.has(status))
              .map((status) => (
                <div
                  key={status}
                  className="flex items-center gap-1.5"
                >
                  <StatusBadge status={status} compact />
                  <span className="text-xs text-muted-foreground font-medium">
                    {byStatus.get(status)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Breakdown par epic */}
        {sortedEpics.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Progress by epic</p>
            <div className="space-y-2">
              {sortedEpics.map(([epicId, data]) => {
                const percent =
                  data.total > 0
                    ? Math.round((data.done / data.total) * 100)
                    : 0;
                return (
                  <div key={epicId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Epic {epicId}
                      </span>
                      <span className="text-muted-foreground">
                        {data.done}/{data.total}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
