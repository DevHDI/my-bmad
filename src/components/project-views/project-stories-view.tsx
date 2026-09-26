import { StoriesView } from "@/components/stories/stories-view";
import type { BmadProject } from "@/lib/bmad/types";
import type { ProjectViewBaseProps } from "./types";

interface ProjectStoriesViewProps extends ProjectViewBaseProps {
  project: BmadProject;
}

/** Stories tab. Story links are resolved from the current pathname by `StoriesTable`. */
export function ProjectStoriesView({ project }: ProjectStoriesViewProps) {
  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stories</h1>
        <p className="text-muted-foreground mt-1">
          {project.stories.length} stories across {project.epics.length}{" "}
          epics
        </p>
      </div>
      <StoriesView stories={project.stories} epics={project.epics} />
    </div>
  );
}
