import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db/client";

if (!process.env.BETTER_AUTH_SECRET) {
  console.warn("Missing BETTER_AUTH_SECRET — auth token signing will fail");
}
if (!process.env.GITHUB_CLIENT_ID) {
  console.warn("Missing GITHUB_CLIENT_ID — GitHub OAuth will not work");
}
if (!process.env.GITHUB_CLIENT_SECRET) {
  console.warn("Missing GITHUB_CLIENT_SECRET — GitHub OAuth will not work");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      scope: ["repo", "read:user"],
    },
  },
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
});

export type Session = typeof auth.$Infer.Session;
