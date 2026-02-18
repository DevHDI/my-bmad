import { Layers, BookOpen, CheckCircle2, Clock, FolderGit2 } from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import type { BmadProject } from "@/lib/bmad/types";

interface GlobalStatsBarProps {
  projects: BmadProject[];
}

export function GlobalStatsBar({ projects }: GlobalStatsBarProps) {
  const totalEpics = projects.reduce((sum, p) => sum + p.epics.length, 0);
  const totalStories = projects.reduce((sum, p) => sum + p.totalStories, 0);
  const completedStories = projects.reduce(
    (sum, p) => sum + p.completedStories,
    0
  );
  const inProgressStories = projects.reduce(
    (sum, p) => sum + p.inProgressStories,
    0
  );
  const activeProjects = projects.filter((p) => p.inProgressStories > 0).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatsCard
        title="Projects"
        value={projects.length}
        icon={FolderGit2}
        color="primary"
        description={
          activeProjects > 0
            ? `${activeProjects} active`
            : projects.length > 0
              ? "All completed"
              : undefined
        }
      />
      <StatsCard
        title="Epics"
        value={totalEpics}
        icon={Layers}
        color="violet"
        description={`Across ${projects.length} projects`}
      />
      <StatsCard
        title="Stories"
        value={totalStories}
        icon={BookOpen}
        color="blue"
      />
      <StatsCard
        title="Completed"
        value={completedStories}
        icon={CheckCircle2}
        color="emerald"
        description={
          totalStories > 0
            ? `${Math.round((completedStories / totalStories) * 100)}% completed`
            : undefined
        }
      />
      <StatsCard
        title="In Progress"
        value={inProgressStories}
        icon={Clock}
        color="amber"
      />
    </div>
  );
}
