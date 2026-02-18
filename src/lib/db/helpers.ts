import { cache } from "react";
import { auth } from "@/lib/auth/auth";
import type { Session } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/client";
import type { RepoConfig, ActionResult, UserRole } from "@/lib/types";

/**
 * Get the authenticated session with userId and role. Cached per request via React cache().
 * Returns null if not authenticated.
 */
export const getAuthenticatedSession = cache(
  async (): Promise<{ userId: string; role: UserRole } | null> => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return null;
    const role = (session.user.role === "admin" ? "admin" : "user") satisfies UserRole;
    return { userId: session.user.id, role };
  }
);

/**
 * Require admin role. Returns ActionResult with error if not admin.
 */
export async function requireAdmin(): Promise<ActionResult<{ userId: string }>> {
  const session = await getAuthenticatedSession();
  if (!session) {
    return { success: false, error: "Not authenticated", code: "UNAUTHORIZED" };
  }
  if (session.role !== "admin") {
    return { success: false, error: "Access denied", code: "FORBIDDEN" };
  }
  return { success: true, data: { userId: session.userId } };
}

/**
 * Get the authenticated user's ID. Cached per request via React cache().
 * Delegates to getAuthenticatedSession to avoid duplicate auth.api.getSession calls.
 */
export const getAuthenticatedUserId = cache(
  async (): Promise<string | null> => {
    const session = await getAuthenticatedSession();
    return session?.userId ?? null;
  }
);

/**
 * Get all repos for the authenticated user. Cached per request via React cache().
 * Deduplicates across layout.tsx and page.tsx within the same render.
 */
export const getAuthenticatedRepos = cache(
  async (userId: string): Promise<RepoConfig[]> => {
    return prisma.repo.findMany({
      where: { userId },
      select: { owner: true, name: true, branch: true, displayName: true, description: true, lastSyncedAt: true },
      orderBy: { createdAt: "desc" },
    });
  }
);

/**
 * Get a single repo config for the authenticated user. Cached per request.
 * Returns null if not found (user doesn't own this repo).
 */
export const getAuthenticatedRepoConfig = cache(
  async (
    userId: string,
    owner: string,
    name: string
  ): Promise<RepoConfig | null> => {
    return prisma.repo.findFirst({
      where: { userId, owner, name },
      select: { owner: true, name: true, branch: true, displayName: true, description: true, lastSyncedAt: true },
    });
  }
);
