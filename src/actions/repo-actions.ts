"use server";

import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { repoTag } from "@/lib/github/cache-tags";
import { auth } from "@/lib/auth/auth";
import {
  createUserOctokit,
  getGitHubToken,
  getCachedUserRepoTree,
  getCachedUserRawContent,
} from "@/lib/github/client";
import { buildFileTree } from "@/lib/bmad/utils";
import { parseBmadFile } from "@/lib/bmad/parser";
import { prisma } from "@/lib/db/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { z } from "zod";
import type { GitHubRepo } from "@/lib/github/types";
import type { FileTreeNode, ParsedBmadFile } from "@/lib/bmad/types";
import type { ActionResult } from "@/lib/types";
import { sanitizeError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";

// GraphQL can handle ~30 repos per query safely (GitHub complexity limits)
const GRAPHQL_BATCH_SIZE = 30;

/**
 * Validate session and retrieve an authenticated Octokit instance.
 * Shared helper to avoid duplicating auth logic across Server Actions.
 */
async function getAuthenticatedOctokit(): Promise<
  ActionResult<{ octokit: ReturnType<typeof createUserOctokit>; userId: string }>
> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated", code: "UNAUTHORIZED" };
  }

  const token = await getGitHubToken(session.user.id);
  if (!token) {
    return {
      success: false,
      error: "GitHub OAuth token not found. Please reconnect.",
      code: "TOKEN_MISSING",
    };
  }

  return {
    success: true,
    data: { octokit: createUserOctokit(token), userId: session.user.id },
  };
}

/**
 * Phase 1: List repos (fast — no BMAD detection).
 */
export async function listUserRepos(): Promise<ActionResult<GitHubRepo[]>> {
  const authResult = await getAuthenticatedOctokit();
  if (!authResult.success) return authResult;

  const { octokit, userId } = authResult.data;

  if (!checkRateLimit(`list:${userId}`, 30, 60000)) {
    return { success: false, error: "Trop de requêtes", code: "RATE_LIMIT" };
  }

  try {
    const repos = await octokit.paginate(
      octokit.rest.repos.listForAuthenticatedUser,
      { per_page: 100, sort: "updated" }
    );

    const mapped: GitHubRepo[] = repos.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      name: r.name,
      owner: r.owner.login,
      description: r.description ?? null,
      isPrivate: r.private,
      updatedAt: r.updated_at ?? "",
      defaultBranch: r.default_branch ?? "main",
      hasBmad: false,
    }));

    return { success: true, data: mapped };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status: number }).status === 403
    ) {
      return {
        success: false,
        error: "GitHub rate limit reached. Try again in a few minutes.",
        code: "RATE_LIMITED",
      };
    }
    return { success: false, error: sanitizeError(error, "GITHUB_ERROR"), code: "GITHUB_ERROR" };
  }
}

/**
 * Phase 2: Detect BMAD via GraphQL (batch — ~30 repos per query).
 *
 * Uses GitHub GraphQL with proper variables to check for _bmad/ and
 * _bmad-output/ in a single request per batch instead of N individual REST calls.
 */
export async function detectBmadRepos(
  repoIds: { fullName: string; owner: string; name: string }[]
): Promise<ActionResult<Record<string, boolean>>> {
  const authResult = await getAuthenticatedOctokit();
  if (!authResult.success) return authResult;

  const { octokit } = authResult.data;
  const results: Record<string, boolean> = {};

  for (let i = 0; i < repoIds.length; i += GRAPHQL_BATCH_SIZE) {
    const chunk = repoIds.slice(i, i + GRAPHQL_BATCH_SIZE);

    // Build GraphQL query with parameterized variables to prevent injection
    const variables: Record<string, string> = {};
    const repoFragments = chunk.map((repo, idx) => {
      const alias = `repo_${idx}`;
      const ownerVar = `$owner_${idx}`;
      const nameVar = `$name_${idx}`;
      variables[`owner_${idx}`] = repo.owner;
      variables[`name_${idx}`] = repo.name;
      return `${alias}: repository(owner: ${ownerVar}, name: ${nameVar}) {
      bmad: object(expression: "HEAD:_bmad") { __typename }
      bmadOutput: object(expression: "HEAD:_bmad-output") { __typename }
    }`;
    });

    const variableDeclarations = chunk
      .map((_, idx) => `$owner_${idx}: String!, $name_${idx}: String!`)
      .join(", ");

    const query = `query BmadDetect(${variableDeclarations}) { ${repoFragments.join("\n")} }`;

    try {
      const response: Record<
        string,
        { bmad: { __typename: string } | null; bmadOutput: { __typename: string } | null } | null
      > = await octokit.graphql(query, variables);

      chunk.forEach((repo, idx) => {
        const data = response[`repo_${idx}`];
        results[repo.fullName] = !!(data?.bmad || data?.bmadOutput);
      });
    } catch (error: unknown) {
      // Log the error for debugging, mark batch repos as unknown (false)
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(
        `[detectBmadRepos] GraphQL batch ${i / GRAPHQL_BATCH_SIZE + 1} failed: ${msg}`
      );
      for (const repo of chunk) {
        results[repo.fullName] = false;
      }
    }
  }

  return { success: true, data: results };
}

const deleteRepoSchema = z.object({
  owner: z.string().min(1).max(255).trim(),
  name: z.string().min(1).max(255).trim(),
});

/**
 * Delete an imported repo from the user's dashboard.
 * Uses deleteMany to avoid exceptions when repo not found (returns count instead).
 */
export async function deleteRepo(input: {
  owner: string;
  name: string;
}): Promise<ActionResult<{ deleted: boolean }>> {
  const parsed = deleteRepoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid data", code: "VALIDATION_ERROR" };
  }

  const authResult = await getAuthenticatedOctokit();
  if (!authResult.success) return authResult;
  const { userId } = authResult.data;

  try {
    const deleted = await prisma.repo.deleteMany({
      where: { userId, owner: parsed.data.owner, name: parsed.data.name },
    });

    if (deleted.count === 0) {
      return { success: false, error: "Repo not found", code: "NOT_FOUND" };
    }

    revalidatePath("/(dashboard)");
    return { success: true, data: { deleted: true } };
  } catch (error: unknown) {
    return { success: false, error: sanitizeError(error, "DB_ERROR"), code: "DB_ERROR" };
  }
}

const refreshRepoSchema = z.object({
  owner: z.string().min(1).max(255).trim(),
  name: z.string().min(1).max(255).trim(),
});

/**
 * Refresh repo data from GitHub: re-fetch tree, count BMAD files, update lastSyncedAt.
 */
export async function refreshRepoData(input: {
  owner: string;
  name: string;
}): Promise<ActionResult<{ totalFiles: number; lastSyncedAt: string }>> {
  const parsed = refreshRepoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid data", code: "VALIDATION_ERROR" };
  }

  const authResult = await getAuthenticatedOctokit();
  if (!authResult.success) return authResult;
  const { octokit, userId } = authResult.data;

  try {
    const repoConfig = await prisma.repo.findFirst({
      where: { userId, owner: parsed.data.owner, name: parsed.data.name },
      select: { id: true, branch: true },
    });

    if (!repoConfig) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
    }

    revalidateTag(repoTag(parsed.data.owner, parsed.data.name), "default");

    // Fetch current default branch from GitHub to detect branch changes
    const { data: ghRepo } = await octokit.rest.repos.get({
      owner: parsed.data.owner,
      repo: parsed.data.name,
    });
    const latestBranch = ghRepo.default_branch ?? repoConfig.branch;

    const { data: tree } = await octokit.rest.git.getTree({
      owner: parsed.data.owner,
      repo: parsed.data.name,
      tree_sha: latestBranch,
      recursive: "1",
    });

    const totalFiles = tree.tree.filter(
      (item) => item.type === "blob" && item.path?.startsWith("_bmad-output/")
    ).length;

    const now = new Date();
    await prisma.repo.update({
      where: { id: repoConfig.id },
      data: { lastSyncedAt: now, branch: latestBranch, totalFiles },
    });

    return { success: true, data: { totalFiles, lastSyncedAt: now.toISOString() } };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status: number }).status === 403
    ) {
      return {
        success: false,
        error: "GitHub rate limit reached. Cached data is displayed.",
        code: "RATE_LIMITED",
      };
    }
    return { success: false, error: sanitizeError(error, "GITHUB_ERROR"), code: "GITHUB_ERROR" };
  }
}

const importRepoSchema = z.object({
  owner: z.string().min(1).max(255).trim(),
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(1000).nullable(),
  defaultBranch: z.string().min(1).max(255).trim(),
  fullName: z.string().min(1).max(512).trim(),
});

/**
 * Import a BMAD repo into the user's dashboard.
 * Creates a Repo entry in the database and revalidates the dashboard layout.
 */
export async function importRepo(input: {
  owner: string;
  name: string;
  description: string | null;
  defaultBranch: string;
  fullName: string;
}): Promise<
  ActionResult<{ id: string; owner: string; name: string; displayName: string }>
> {
  const parsed = importRepoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid data: " + parsed.error.issues[0].message,
      code: "VALIDATION_ERROR",
    };
  }
  const data = parsed.data;

  const authResult = await getAuthenticatedOctokit();
  if (!authResult.success) return authResult;

  const { userId } = authResult.data;

  if (!checkRateLimit(`import:${userId}`, 10, 60000)) {
    return { success: false, error: "Trop de requêtes", code: "RATE_LIMIT" };
  }

  try {
    const repo = await prisma.repo.create({
      data: {
        owner: data.owner,
        name: data.name,
        branch: data.defaultBranch,
        displayName: data.name,
        description: data.description,
        lastSyncedAt: new Date(),
        userId,
      },
      select: { id: true, owner: true, name: true, displayName: true },
    });

    revalidatePath("/(dashboard)");
    return { success: true, data: repo };
  } catch (error: unknown) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "This repository is already imported.",
        code: "DUPLICATE",
      };
    }
    return { success: false, error: sanitizeError(error, "DB_ERROR"), code: "DB_ERROR" };
  }
}

// ---------------------------------------------------------------------------
// BMAD file browsing Server Actions (Story 4-1)
// ---------------------------------------------------------------------------

const BMAD_OUTPUT = "_bmad-output";
const BMAD_CORE = "_bmad";

const fetchBmadFilesSchema = z.object({
  owner: z.string().min(1).max(255).trim(),
  name: z.string().min(1).max(255).trim(),
});

/**
 * Fetch the BMAD file tree for a repo using the user's OAuth token.
 * Returns separate trees for _bmad-output/, _bmad/ and docs/ folders.
 */
export async function fetchBmadFiles(input: {
  owner: string;
  name: string;
}): Promise<
  ActionResult<{
    fileTree: FileTreeNode[];
    docsTree: FileTreeNode[];
    bmadCoreTree: FileTreeNode[];
    bmadFiles: string[];
  }>
> {
  const parsed = fetchBmadFilesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid data", code: "VALIDATION_ERROR" };
  }

  const authResult = await getAuthenticatedOctokit();
  if (!authResult.success) return authResult;
  const { octokit, userId } = authResult.data;

  const repoConfig = await prisma.repo.findFirst({
    where: { userId, owner: parsed.data.owner, name: parsed.data.name },
    select: { branch: true },
  });
  if (!repoConfig) {
    return { success: false, error: "Project not found", code: "NOT_FOUND" };
  }

  try {
    const tree = await getCachedUserRepoTree(
      octokit,
      userId,
      parsed.data.owner,
      parsed.data.name,
      repoConfig.branch,
    );

    const allPaths = tree.tree
      .filter((item) => item.type === "blob")
      .map((item) => item.path);

    const bmadPaths = allPaths.filter((p) => p.startsWith(BMAD_OUTPUT + "/"));
    const fileTree = buildFileTree(bmadPaths, BMAD_OUTPUT);

    // Build _bmad/ core tree (config, workflows, templates)
    const bmadCorePaths = allPaths.filter(
      (p) => p.startsWith(BMAD_CORE + "/"),
    );
    const bmadCoreTree = buildFileTree(bmadCorePaths, BMAD_CORE);

    // Detect docs/ folder at repo root (case-insensitive)
    const docsFolder = tree.tree.find(
      (item) =>
        item.type === "tree" &&
        !item.path.includes("/") &&
        item.path.toLowerCase() === "docs",
    );
    const docsFolderName = docsFolder?.path ?? null;
    const docsTree = docsFolderName
      ? buildFileTree(
          allPaths.filter((p) => p.startsWith(docsFolderName + "/")),
          docsFolderName,
        )
      : [];

    return { success: true, data: { fileTree, docsTree, bmadCoreTree, bmadFiles: bmadPaths } };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status: number }).status === 403
    ) {
      return {
        success: false,
        error:
          "GitHub rate limit reached. Cached data is displayed.",
        code: "RATE_LIMITED",
      };
    }
    return { success: false, error: sanitizeError(error, "GITHUB_ERROR"), code: "GITHUB_ERROR" };
  }
}

const fetchFileContentSchema = z.object({
  owner: z.string().min(1).max(255).trim(),
  name: z.string().min(1).max(255).trim(),
  path: z
    .string()
    .min(1)
    .max(1024)
    .trim()
    .refine((p) => !p.includes(".."), { message: "Invalid path" }),
});

/**
 * Fetch individual file content via the user's OAuth token (lazy loading).
 * Determines contentType from file extension.
 */
export async function fetchFileContent(input: {
  owner: string;
  name: string;
  path: string;
}): Promise<
  ActionResult<{
    content: string;
    contentType: "markdown" | "yaml" | "json" | "text";
  }>
> {
  const parsed = fetchFileContentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid data: " + parsed.error.issues[0].message,
      code: "VALIDATION_ERROR",
    };
  }

  const authResult = await getAuthenticatedOctokit();
  if (!authResult.success) return authResult;
  const { octokit, userId } = authResult.data;

  const repoConfig = await prisma.repo.findFirst({
    where: { userId, owner: parsed.data.owner, name: parsed.data.name },
    select: { branch: true },
  });
  if (!repoConfig) {
    return { success: false, error: "Project not found", code: "NOT_FOUND" };
  }

  try {
    const content = await getCachedUserRawContent(
      octokit,
      userId,
      parsed.data.owner,
      parsed.data.name,
      repoConfig.branch,
      parsed.data.path,
    );

    const ext = parsed.data.path.split(".").pop()?.toLowerCase() ?? "";
    let contentType: "markdown" | "yaml" | "json" | "text" = "text";
    if (ext === "md") contentType = "markdown";
    else if (ext === "yaml" || ext === "yml") contentType = "yaml";
    else if (ext === "json") contentType = "json";

    return { success: true, data: { content, contentType } };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error
    ) {
      const status = (error as { status: number }).status;
      if (status === 403) {
        return {
          success: false,
          error:
            "GitHub rate limit reached. Try again in a few minutes.",
          code: "RATE_LIMITED",
        };
      }
      if (status === 404) {
        return {
          success: false,
          error: "File not found.",
          code: "NOT_FOUND",
        };
      }
    }
    return { success: false, error: sanitizeError(error, "GITHUB_ERROR"), code: "GITHUB_ERROR" };
  }
}

/**
 * Fetch and parse a BMAD file in a single server action call.
 * Combines fetchFileContent + parseBmadFile to avoid importing
 * gray-matter / js-yaml on the client.
 */
export async function fetchParsedFileContent(input: {
  owner: string;
  name: string;
  path: string;
}): Promise<ActionResult<ParsedBmadFile>> {
  const result = await fetchFileContent(input);
  if (!result.success) return result;

  const parsed = parseBmadFile(result.data.content, result.data.contentType);
  return { success: true, data: parsed };
}
