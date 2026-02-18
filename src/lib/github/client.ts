import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import { retry } from "@octokit/plugin-retry";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/client";
import { GitHubTreeResponse } from "./types";
import { repoTag, fileTag } from "./cache-tags";

// Octokit with throttling and retry plugins
const OctokitWithPlugins = Octokit.plugin(throttling, retry);

/**
 * Create an Octokit instance authenticated with a user's OAuth token.
 */
export function createUserOctokit(accessToken: string) {
  return new OctokitWithPlugins({
    auth: accessToken,
    throttle: {
      onRateLimit: (retryAfter, options, octokit, retryCount) => {
        octokit.log.warn(
          `Rate limit hit for ${options.method} ${options.url}`
        );
        if (retryCount < 2) {
          octokit.log.info(`Retrying after ${retryAfter} seconds`);
          return true;
        }
        return false;
      },
      onSecondaryRateLimit: (retryAfter, options, octokit) => {
        octokit.log.warn(
          `Secondary rate limit for ${options.method} ${options.url}`
        );
        return false;
      },
    },
  });
}

/**
 * Retrieve the GitHub OAuth access token for a user from the accounts table.
 * Returns null if no token is found (user needs to re-authenticate).
 */
export async function getGitHubToken(
  userId: string
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "github" },
    select: { accessToken: true },
  });

  return account?.accessToken ?? null;
}

// ---------------------------------------------------------------------------
// Authenticated Octokit helpers (user OAuth token)
// ---------------------------------------------------------------------------

type UserOctokit = ReturnType<typeof createUserOctokit>;

/**
 * Fetch the full recursive tree of a repo using the user's authenticated Octokit.
 */
export async function getUserRepoTree(
  octokit: UserOctokit,
  owner: string,
  repo: string,
  branch: string,
): Promise<GitHubTreeResponse> {
  const { data } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: "1",
  });

  return {
    sha: data.sha,
    url: data.url ?? "",
    tree: (data.tree as GitHubTreeResponse["tree"]),
    truncated: data.truncated ?? false,
  };
}

/**
 * Fetch raw file content from a repo using the user's authenticated Octokit.
 * Decodes base64 content returned by the GitHub Contents API.
 */
export async function getUserRawContent(
  octokit: UserOctokit,
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string> {
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref: branch,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`Path "${path}" is not a file`);
  }

  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  // Fallback: content may already be decoded for small files
  return data.content ?? "";
}

// ---------------------------------------------------------------------------
// Cached Octokit helpers (TTL 5 min / 300s)
// ---------------------------------------------------------------------------

const CACHE_TTL = 300; // 5 minutes

/**
 * Cached version of getUserRepoTree. Uses Next.js unstable_cache with
 * repo-level tags for invalidation via revalidateTag().
 * userId is included in the cache key to prevent data leakage between users.
 */
export function getCachedUserRepoTree(
  octokit: UserOctokit,
  userId: string,
  owner: string,
  repo: string,
  branch: string,
) {
  return unstable_cache(
    () => getUserRepoTree(octokit, owner, repo, branch),
    [`repo-tree`, userId, owner, repo, branch],
    { revalidate: CACHE_TTL, tags: [repoTag(owner, repo)] },
  )();
}

/**
 * Cached version of getUserRawContent. Uses Next.js unstable_cache with
 * file-level tags for granular invalidation.
 * userId is included in the cache key to prevent data leakage between users.
 */
export function getCachedUserRawContent(
  octokit: UserOctokit,
  userId: string,
  owner: string,
  repo: string,
  branch: string,
  path: string,
) {
  return unstable_cache(
    () => getUserRawContent(octokit, owner, repo, branch, path),
    [`file-content`, userId, owner, repo, branch, path],
    { revalidate: CACHE_TTL, tags: [repoTag(owner, repo), fileTag(owner, repo, path)] },
  )();
}

