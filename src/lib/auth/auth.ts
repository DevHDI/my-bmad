import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { prisma } from "@/lib/db/client";

if (process.env.NEXT_PHASE !== "phase-production-build") {
  if (!process.env.BETTER_AUTH_SECRET) {
    console.warn("Missing BETTER_AUTH_SECRET — auth token signing will fail");
  }
}

const hasGitHubCredentials =
  !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  ...(hasGitHubCredentials && {
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        scope: ["repo", "read:user"],
      },
    },
  }),
  session: {
    expiresIn: Math.max(Number(process.env.SESSION_EXPIRES_IN) || 60 * 60 * 24 * 7, 300), // Default: 7 jours, min: 5 min
    updateAge: Math.max(Number(process.env.SESSION_UPDATE_AGE) || 60 * 60 * 24, 60), // Default: 1 jour, min: 1 min
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        if (process.env.ALLOW_REGISTRATION !== "true") {
          throw new APIError("FORBIDDEN", {
            message: "Registration is disabled",
          });
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // Normalize sign-up errors to prevent account enumeration. Better
      // Auth's default behavior returns HTTP 422 when the email is already
      // registered, which lets an unauthenticated caller distinguish
      // known-vs-unknown addresses by iterating a list. Collapse every
      // non-FORBIDDEN failure into a single generic BAD_REQUEST so the
      // response carries no signal about the email's existence.
      //
      // The FORBIDDEN branch (registration disabled) is preserved because
      // it reflects a server-wide flag, not a per-email signal.
      if (ctx.path !== "/sign-up/email") return;
      const returned = ctx.context.returned;
      if (returned instanceof APIError && returned.status !== "FORBIDDEN") {
        throw new APIError("BAD_REQUEST", { message: "Sign-up failed" });
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
