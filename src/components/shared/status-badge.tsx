import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StoryStatus, EpicStatus } from "@/lib/bmad/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  done: {
    label: "Done",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
  },
  review: {
    label: "Review",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  },
  blocked: {
    label: "Blocked",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  },
  "ready-for-dev": {
    label: "Ready for Dev",
    className: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/25",
  },
  backlog: {
    label: "Backlog",
    className: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/25",
  },
  "not-started": {
    label: "Not Started",
    className: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/25",
  },
  unknown: {
    label: "Unknown",
    className: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-500 border-zinc-500/25",
  },
};

interface StatusBadgeProps {
  status: StoryStatus | EpicStatus;
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
