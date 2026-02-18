import { StatsCard } from "@/components/shared/stats-card";
import { Layers, BookOpen, CheckCircle2, Zap } from "lucide-react";

interface ProjectStatsGridProps {
  totalEpics: number;
  totalStories: number;
  completedStories: number;
  sprintProgress: number | null;
}

export function ProjectStatsGrid({
  totalEpics,
  totalStories,
  completedStories,
  sprintProgress,
}: ProjectStatsGridProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Epics"
        value={totalEpics}
        icon={Layers}
        color="violet"
        description="Total epics"
      />
      <StatsCard
        title="Stories"
        value={totalStories}
        icon={BookOpen}
        color="blue"
        description="Total stories"
      />
      <StatsCard
        title="Completed"
        value={completedStories}
        icon={CheckCircle2}
        color="emerald"
        description="Completed stories"
      />
      <StatsCard
        title="Sprint"
        value={sprintProgress !== null ? `${sprintProgress}%` : "—"}
        icon={Zap}
        color="amber"
        description={
          sprintProgress !== null ? "Sprint progress" : "No sprint defined"
        }
      />
    </div>
  );
}
