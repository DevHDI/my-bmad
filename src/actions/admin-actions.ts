"use server";

import { requireAdmin } from "@/lib/db/helpers";
import { prisma } from "@/lib/db/client";
import type { ActionResult } from "@/lib/types";
import { sanitizeError } from "@/lib/errors";

// --- Types ---

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  _count: { repos: number };
}

export interface UsageMetrics {
  totalUsers: number;
  totalRepos: number;
  recentUsers: number;
  activeUsersLast30d: number;
  // null = not yet tracked. The UI renders this as "N/A" so admins
  // don't read 0% as "no parsing errors" when the data simply doesn't
  // exist. Switch to number once a parsing-error log table is added.
  parsingErrorRate: number | null;
}

// --- Server Actions ---

/**
 * Get all users with their repo counts. Admin only.
 */
export async function getUsers(): Promise<ActionResult<AdminUser[]>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: { select: { repos: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: users };
  } catch (error: unknown) {
    return { success: false, error: sanitizeError(error, "DB_ERROR"), code: "DB_ERROR" };
  }
}

/**
 * Get usage metrics. Admin only.
 */
export async function getUsageMetrics(): Promise<ActionResult<UsageMetrics>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, totalRepos, recentUsers, activeSessionUsers] = await Promise.all([
      prisma.user.count(),
      prisma.repo.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.session.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

    return {
      success: true,
      data: {
        totalUsers,
        totalRepos,
        recentUsers,
        activeUsersLast30d: activeSessionUsers.length,
        // MVP: no parsing-error log table exists yet. Returning null
        // (rather than 0) keeps the UI honest — admins see "N/A"
        // instead of a fabricated "0% errors" signal.
        parsingErrorRate: null,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: sanitizeError(error, "DB_ERROR"), code: "DB_ERROR" };
  }
}
