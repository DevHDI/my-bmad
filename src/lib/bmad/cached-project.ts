import { cache } from "react";
import { getBmadProject } from "./parser";
import type { RepoConfig } from "@/lib/types";
import type { BmadProject } from "./types";

/**
 * React.cache()-wrapped version of getBmadProject.
 * Deduplicates calls within the same React Server Component render tree,
 * so Overview / Stories / Epics pages sharing a layout trigger only one
 * GitHub API call per navigation.
 */
export const getCachedBmadProject = cache(
  async (
    config: RepoConfig,
    accessToken: string | undefined,
    userId: string | undefined,
  ): Promise<BmadProject | null> => {
    return getBmadProject(config, accessToken, userId);
  },
);
