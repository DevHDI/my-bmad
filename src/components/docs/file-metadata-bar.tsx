import { StatusBadge } from "@/components/shared/status-badge";
import { CheckCircle2, Calendar, Workflow } from "lucide-react";
import type { BmadFileMetadata, StoryStatus } from "@/lib/bmad/types";

interface FileMetadataBarProps {
  metadata: BmadFileMetadata;
}

const statusValues = new Set([
  "done",
  "in-progress",
  "review",
  "blocked",
  "backlog",
  "unknown",
]);

export function FileMetadataBar({ metadata }: FileMetadataBarProps) {
  const hasStatus =
    metadata.status &&
    metadata.status !== "unknown" &&
    statusValues.has(metadata.status);
  const hasSteps =
    metadata.stepsCompleted && metadata.stepsCompleted.length > 0;
  const hasWorkflowType = !!metadata.workflowType;
  const hasCompletedAt = !!metadata.completedAt;

  if (!hasStatus && !hasSteps && !hasWorkflowType && !hasCompletedAt) {
    return null;
  }

  return (
    <div className="glass-card flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 mb-4 text-sm">
      {hasStatus && (
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Status</span>
          <StatusBadge status={metadata.status as StoryStatus} />
        </div>
      )}

      {hasSteps && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CheckCircle2 className="size-3.5" />
          <span>
            Steps completed: {metadata.stepsCompleted?.length}
          </span>
        </div>
      )}

      {hasWorkflowType && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Workflow className="size-3.5" />
          <span>Type: {metadata.workflowType}</span>
        </div>
      )}

      {hasCompletedAt && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="size-3.5" />
          <span>Completed on {metadata.completedAt}</span>
        </div>
      )}

    </div>
  );
}
