import { EpicsBrowser } from "@/components/epics/epics-browser";
import type { BmadProject } from "@/lib/bmad/types";
import type { ProjectViewBaseProps } from "./types";

interface ProjectEpicsViewProps extends ProjectViewBaseProps {
  project: BmadProject;
}

/**
 * Epics tab. `EpicsBrowser` uses `useBreadcrumb()`, so this view must be
 * rendered under a `BreadcrumbProvider`.
 */
export function ProjectEpicsView({ project }: ProjectEpicsViewProps) {
  const totalEpicProgress = project.epics.length > 0
    ? Math.round(
        project.epics.reduce((sum, e) => sum + e.progressPercent, 0) /
          project.epics.length
      )
    : 0;

  return (
    <EpicsBrowser
      epics={project.epics}
      stories={project.stories}
      totalEpics={project.epics.length}
      totalStories={project.totalStories}
      totalEpicProgress={totalEpicProgress}
    />
  );
}
