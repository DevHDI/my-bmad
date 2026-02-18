import { RepoCard } from "./repo-card";
import { AddRepoCard } from "./add-repo-card";
import type { BmadProject } from "@/lib/bmad/types";
import type { RepoConfig } from "@/lib/types";

interface ReposGridProps {
  projects: BmadProject[];
  repos: RepoConfig[];
}

export function ReposGrid({ projects, repos }: ReposGridProps) {
  if (repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No project imported
        </p>
        <p className="mt-2 text-sm text-muted-foreground mb-4">
          Add a BMAD repo to get started.
        </p>
        <AddRepoCard />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          Failed to load projects
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Data from your {repos.length} repo{repos.length > 1 ? "s" : ""} could not be fetched. Check your connection or try again.
        </p>
      </div>
    );
  }

  const descriptionMap = new Map(
    repos.map((r) => [`${r.owner}/${r.name}`, r.description])
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <RepoCard
          key={`${project.owner}/${project.repo}`}
          project={project}
          description={descriptionMap.get(`${project.owner}/${project.repo}`) ?? null}
        />
      ))}
      <AddRepoCard />
    </div>
  );
}
