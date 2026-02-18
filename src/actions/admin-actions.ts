"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/db/helpers";
import { prisma } from "@/lib/db/client";
import { z } from "zod";
import type { ActionResult } from "@/lib/types";
import { sanitizeError } from "@/lib/errors";

// --- Types ---

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: Date;
  _count: { repos: number };
}

export interface UsageMetrics {
  totalUsers: number;
  totalRepos: number;
  recentUsers: number;
  activeUsersLast30d: number;
  parsingErrorRate: number;
}

// --- Error classes for control flow in transactions ---

class UserNotFoundError extends Error {}
class LastAdminError extends Error {}

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
        role: true,
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

const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  newRole: z.enum(["user", "admin"]),
});

/**
 * Update a user's role. Admin only.
 * Prevents self-demotion and demoting the last admin.
 */
export async function updateUserRole(
  input: z.infer<typeof updateUserRoleSchema>
): Promise<ActionResult<AdminUser>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  const parsed = updateUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid data", code: "VALIDATION_ERROR" };
  }

  // Prevent self-demotion (use authResult.data.userId instead of redundant getAuthenticatedSession call)
  if (parsed.data.userId === authResult.data.userId) {
    return {
      success: false,
      error: "Cannot change your own role",
      code: "SELF_DEMOTION",
    };
  }

  try {
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Prevent demoting the last admin (inside transaction to avoid race condition)
      if (parsed.data.newRole === "user") {
        const target = await tx.user.findUnique({
          where: { id: parsed.data.userId },
          select: { role: true },
        });
        if (!target) {
          throw new UserNotFoundError();
        }
        if (target.role === "admin") {
          const adminCount = await tx.user.count({ where: { role: "admin" } });
          if (adminCount <= 1) {
            throw new LastAdminError();
          }
        }
      } else {
        const target = await tx.user.findUnique({
          where: { id: parsed.data.userId },
          select: { id: true },
        });
        if (!target) {
          throw new UserNotFoundError();
        }
      }

      return tx.user.update({
        where: { id: parsed.data.userId },
        data: { role: parsed.data.newRole },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          _count: { select: { repos: true } },
        },
      });
    });

    revalidatePath("/admin");
    return { success: true, data: updatedUser };
  } catch (error: unknown) {
    if (error instanceof UserNotFoundError) {
      return { success: false, error: "User not found", code: "NOT_FOUND" };
    }
    if (error instanceof LastAdminError) {
      return { success: false, error: "Cannot demote the last administrator", code: "LAST_ADMIN" };
    }
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
        parsingErrorRate: 0, // MVP : pas de table de logs parsing — retourne 0
      },
    };
  } catch (error: unknown) {
    return { success: false, error: sanitizeError(error, "DB_ERROR"), code: "DB_ERROR" };
  }
}
