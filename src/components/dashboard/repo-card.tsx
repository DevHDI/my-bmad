import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/shared/progress-ring";
import { ParseErrorsDialog } from "@/components/shared/parse-errors-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { GitBranch, BookOpen, Layers } from "lucide-react";
import type { BmadProject, Epic } from "@/lib/bmad/types";

interface RepoCardProps {
  project: BmadProject;
  description: string | null;
}

function getBarColor(percent: number) {
  if (percent >= 75) return "bg-emerald-500";
  if (percent >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

function EpicSummaryRow({ epic }: { epic: Epic }) {
  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={epic.status} compact />
      <span
        className="text-xs text-muted-foreground truncate min-w-0 flex-1"
        title={`${epic.id}. ${epic.title}`}
      >
        {epic.id}. {epic.title}
      </span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {epic.completedStories}/{epic.totalStories}
      </span>
      <div
        className="h-1 w-16 shrink-0 rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={epic.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Epic ${epic.id} progress: ${epic.progressPercent}%`}
      >
        <div
          className={`h-full rounded-full ${getBarColor(epic.progressPercent)} transition-all duration-500`}
          style={{ width: `${epic.progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export function RepoCard({ project, description }: RepoCardProps) {
  const visibleEpics = project.epics.slice(0, 3);
  const remainingEpics = Math.max(0, project.epics.length - 3);

  return (
    <Link href={`/repo/${project.owner}/${project.repo}`}>
      <Card className="glass-card hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                {project.displayName}
                {(project.parseHealth?.errors.length ?? 0) > 0 && (
                  <ParseErrorsDialog errors={project.parseHealth?.errors ?? []} />
                )}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                <span>{project.owner}/{project.repo}</span>
              </div>
              {description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {description}
                </p>
              )}
            </div>
            <ProgressRing percent={project.progressPercent} size={52} strokeWidth={4} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              <span>{project.epics.length} epics</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{project.totalStories} stories</span>
            </div>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {project.completedStories > 0 && (
              <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 text-xs">
                {project.completedStories} completed
              </Badge>
            )}
            {project.inProgressStories > 0 && (
              <Badge variant="outline" className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25 text-xs">
                {project.inProgressStories} in progress
              </Badge>
            )}
          </div>
          {project.epics.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
              {visibleEpics.map((epic) => (
                <EpicSummaryRow key={epic.id} epic={epic} />
              ))}
              {remainingEpics > 0 && (
                <p className="text-xs text-muted-foreground">
                  +{remainingEpics} epics
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
