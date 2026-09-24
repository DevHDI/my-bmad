/**
 * The super admin is the single operator of a MyBMAD instance. It is the only
 * account allowed to open /admin and call admin server actions.
 *
 * Configured with the SUPER_ADMIN_EMAIL environment variable so every
 * self-hosted instance can designate its own operator. When the variable is
 * unset, nobody is super admin.
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!superAdminEmail || !email) return false;
  return email.trim().toLowerCase() === superAdminEmail;
}
