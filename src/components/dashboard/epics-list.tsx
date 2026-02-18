import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SegmentedProgressBar } from "@/components/shared/segmented-progress-bar";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Epic } from "@/lib/bmad/types";

interface EpicsListProps {
  epics: Epic[];
  owner: string;
  repo: string;
}

const statusBorderColor: Record<string, string> = {
  done: "border-l-emerald-500",
  "in-progress": "border-l-blue-500",
  "not-started": "border-l-zinc-400",
};

function getProgressColor(percent: number) {
  return percent >= 100 ? "bg-emerald-500" : "bg-orange-500";
}

export function EpicsList({ epics, owner, repo }: EpicsListProps) {
  if (epics.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
          <Info className="h-5 w-5 shrink-0" />
          <span>No epic found in this project</span>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...epics].sort(
    (a, b) => (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0),
  );

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Epics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((epic) => (
            <Link
              key={epic.id}
              href={`/repo/${owner}/${repo}/epics`}
              className={cn(
                "flex items-center justify-between rounded-lg border border-border/50 border-l-3 p-3 transition-colors duration-300 hover:bg-accent/50",
                statusBorderColor[epic.status] ?? "border-l-zinc-400",
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-muted-foreground shrink-0">
                  E{epic.id}
                </span>
                <span className="font-medium truncate">
                  {epic.title}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <SegmentedProgressBar
                  percent={epic.progressPercent}
                  color={getProgressColor(epic.progressPercent)}
                  className="hidden sm:flex h-2 w-24"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {epic.completedStories}/{epic.totalStories} stories
                </span>
                <StatusBadge status={epic.status} compact />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
