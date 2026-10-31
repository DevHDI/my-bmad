/**
 * Shared contract for the reusable project views.
 *
 * - `owner`: the authenticated owner of the project (refresh, settings,
 *   delete actions and local path are shown).
 * - `guest`: read-only viewer (no modification action, no local path,
 *   no BMAD core tree in the documents).
 */
export type ProjectViewMode = "owner" | "guest";

export interface ProjectViewBaseProps {
  /** Root URL of the project, without trailing slash (e.g. `/repo/o/r`). */
  basePath: string;
  mode: ProjectViewMode;
}
