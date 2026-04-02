import { redirect } from "next/navigation";
import { getBmadProject } from "@/lib/bmad/parser";
import { createUserOctokit, getGitHubToken } from "@/lib/github/client";
import { createContentProvider } from "@/lib/content-provider";
import { ReposGrid } from "@/components/dashboard/repos-grid";
import { GlobalStatsBar } from "@/components/dashboard/global-stats-bar";
import {
  getAuthenticatedUserId,
  getAuthenticatedRepos,
} from "@/lib/db/helpers";
import type { BmadProject } from "@/lib/bmad/types";

const localFsEnabled = process.env.ENABLE_LOCAL_FS === "true";

export default async function DashboardPage() {
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const repos = await getAuthenticatedRepos(userId);

  // Only fetch GitHub token if at least one repo is GitHub-sourced (F34)
  const hasGithubRepos = repos.some((r) => r.sourceType === "github");
  const token = hasGithubRepos ? await getGitHubToken(userId) : null;
  const octokit = token ? createUserOctokit(token) : undefined;

  const projects: BmadProject[] = [];
  const errors: string[] = [];
  const results = await Promise.allSettled(
    repos.map((repo) => {
      const provider = createContentProvider(repo, octokit, userId);
      return getBmadProject(repo, provider);
    })
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled" && result.value !== null) {
      projects.push(result.value);
    } else if (result.status === "rejected") {
      const repo = repos[i];
      const msg = result.reason?.message || String(result.reason);
      console.error(`Failed to fetch ${repo.owner}/${repo.name}:`, msg);
      errors.push(`${repo.displayName}: ${msg}`);
    }
  }

  // F44: Separate error messages by source type
  const hasGithubErrors = errors.length > 0 && repos.some(
    (r, i) => r.sourceType === "github" && results[i].status === "rejected"
  );
  const hasLocalErrors = errors.length > 0 && repos.some(
    (r, i) => r.sourceType === "local" && results[i].status === "rejected"
  );

  return (
    <div className="mesh-gradient min-h-full">
      <div className="space-y-8 pt-6 lg:pt-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of all your BMAD projects
          </p>
        </div>
        {errors.length > 0 && (
          <div role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {errors.length === 1
                ? "1 project could not be loaded"
                : `${errors.length} projects could not be loaded`}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            {hasGithubErrors && errors.some((e) => /\b(404|Not Found)\b/i.test(e)) && (
              <p className="mt-2 text-xs text-muted-foreground">
                If the repo is private, try reconnecting via GitHub to renew your OAuth authorization.
              </p>
            )}
            {hasLocalErrors && (
              <p className="mt-2 text-xs text-muted-foreground">
                Check that the local folder still exists and is accessible on the server.
              </p>
            )}
          </div>
        )}
        {projects.length > 0 && <GlobalStatsBar projects={projects} />}
        <ReposGrid
          projects={projects}
          repos={repos}
          localFsEnabled={localFsEnabled}
          githubEnabled={!!token}
        />
      </div>
    </div>
  );
}
