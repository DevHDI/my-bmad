import { APIError } from "better-auth/api";

export type RegistrationContext = {
  email: string | null | undefined;
  headers?: Headers | null;
};

/**
 * Single source of truth for whether a new account may be created, whatever
 * the sign-up path (email/password or OAuth). Registration is open only when
 * ALLOW_REGISTRATION is "true". Exceptions (e.g. a valid project invitation
 * matching the email) belong here.
 */
export const isRegistrationAllowed: (context: RegistrationContext) => boolean = () =>
  process.env.ALLOW_REGISTRATION === "true";

export function assertRegistrationAllowed(context: RegistrationContext): void {
  if (!isRegistrationAllowed(context)) {
    throw new APIError("FORBIDDEN", {
      message: "Registration is disabled",
    });
  }
}
