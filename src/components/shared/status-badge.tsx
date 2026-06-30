import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StoryStatus, EpicStatus, DefectStatus, DefectSeverity } from "@/lib/bmad/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  done: {
    label: "Done",
    className: "bg-success/15 text-success-foreground border-success/25",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-info/15 text-info-foreground border-info/25",
  },
  review: {
    label: "Review",
    className: "bg-warning/15 text-warning-foreground border-warning/25",
  },
  blocked: {
    label: "Blocked",
    className: "bg-destructive/15 text-destructive-foreground border-destructive/25",
  },
  "ready-for-dev": {
    label: "Ready for Dev",
    className: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/25",
  },
  backlog: {
    label: "Backlog",
    className: "bg-muted text-muted-foreground border-border",
  },
  "not-started": {
    label: "Not Started",
    className: "bg-muted text-muted-foreground border-border",
  },
  unknown: {
    label: "Unknown",
    className: "bg-muted text-muted-foreground border-border",
  },
  // Defect statuses
  open: {
    label: "Open",
    className: "bg-destructive/15 text-destructive-foreground border-destructive/25",
  },
  resolved: {
    label: "Resolved",
    className: "bg-success/15 text-success-foreground border-success/25",
  },
  closed: {
    label: "Closed",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const severityConfig: Record<DefectSeverity, { label: string; className: string }> = {
  critical: {
    label: "Critical",
    className: "bg-destructive text-destructive-foreground border-destructive",
  },
  high: {
    label: "High",
    className: "bg-destructive/15 text-destructive-foreground border-destructive/25",
  },
  medium: {
    label: "Medium",
    className: "bg-warning/15 text-warning-foreground border-warning/25",
  },
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground border-border",
  },
};

interface StatusBadgeProps {
  status: StoryStatus | EpicStatus | DefectStatus;
  compact?: boolean;
}

interface SeverityBadgeProps {
  severity: DefectSeverity;
  compact?: boolean;
}

export function StatusBadge({ status, compact }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.unknown;
  return (
    <Badge
      variant="outline"
      className={cn("min-w-24 justify-center", config.className, compact && "px-1.5 py-0 text-[10px] leading-4")}
    >
      {config.label}
    </Badge>
  );
}

export function SeverityBadge({ severity, compact }: SeverityBadgeProps) {
  const config = severityConfig[severity] || severityConfig.medium;
  return (
    <Badge
      variant="outline"
      className={cn("min-w-20 justify-center", config.className, compact && "px-1.5 py-0 text-[10px] leading-4")}
    >
      {config.label}
    </Badge>
  );
}
