import type { UserRole as PrismaUserRole } from "@/generated/prisma/enums";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * User roles. Sourced from the Prisma `UserRole` enum so the schema stays the
 * single source of truth; `enums.ts` is generated browser-safe and carries no
 * server-only imports.
 */
export type UserRole = PrismaUserRole;

export function isUserRole(value: unknown): value is UserRole {
  return value === "user" || value === "admin";
}

/** Source type for a repo: GitHub remote or local filesystem. */
export type SourceType = "github" | "local";

/** Shared repo config shape used across layout, pages, sidebar, and parser. */
export interface RepoConfig {
  owner: string;
  name: string;
  branch: string;
  displayName: string;
  description: string | null;
  sourceType: SourceType;
  localPath: string | null;
  lastSyncedAt: Date | null;
}
