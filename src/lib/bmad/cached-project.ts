import { cache } from "react";
import { getBmadProject } from "./parser";
import { createContentProvider } from "@/lib/content-provider";
import { createUserOctokit } from "@/lib/github/client";
import type { RepoConfig } from "@/lib/types";
import type { BmadProject } from "./types";

/**
 * React.cache()-wrapped version of getBmadProject.
 * Deduplicates calls within the same React Server Component render tree,
 * so Overview / Stories / Epics pages sharing a layout trigger only one
 * fetch per navigation.
 *
 * F38 CRITICAL: Arguments must remain primitives so React.cache() identity
 * comparison works across sibling pages. The ContentProvider is constructed
 * INSIDE the cached function, not passed as argument.
 */
export const getCachedBmadProject = cache(
  async (
    config: RepoConfig,
    accessToken: string | undefined,
    userId: string | undefined,
  ): Promise<BmadProject | null> => {
    const octokit =
      config.sourceType === "github" && accessToken
        ? createUserOctokit(accessToken)
        : undefined;

    const provider = createContentProvider(config, octokit, userId);
    return getBmadProject(config, provider);
  },
);
