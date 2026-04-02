export type { ContentProvider, ContentProviderTree } from "./types";
export { LOCAL_PROVIDER_DEFAULTS } from "./types";
export { GitHubProvider } from "./github-provider";
export { LocalProvider } from "./local-provider";

import type { ContentProvider } from "./types";
import type { RepoConfig } from "@/lib/types";
import type { UserOctokit } from "@/lib/github/client";
import { GitHubProvider } from "./github-provider";
import { LocalProvider } from "./local-provider";

export function createContentProvider(
  config: RepoConfig,
  octokit?: UserOctokit,
  userId?: string,
): ContentProvider {
  if (config.sourceType === "local") {
    if (!config.localPath) throw new Error("Local provider requires localPath");
    return new LocalProvider(config.localPath);
  }
  if (!octokit || !userId)
    throw new Error("GitHub provider requires octokit and userId");
  return new GitHubProvider(octokit, userId, config.owner, config.name, config.branch);
}
