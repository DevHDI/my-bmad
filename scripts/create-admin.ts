/**
 * Create an admin user via email/password for first deployment.
 *
 * Usage:
 *   pnpm db:create-admin --email admin@example.com --password secret --name Admin
 *
 * This script uses better-auth's internal sign-up flow so the password is
 * hashed with the same algorithm (scrypt by default). It temporarily forces
 * ALLOW_REGISTRATION=true for the duration of the script.
 */

import "dotenv/config";

// Force registration on for this script
process.env.ALLOW_REGISTRATION = "true";

import { prisma } from "../src/lib/db/client";
import { auth } from "../src/lib/auth/auth";

function parseArgs(): { email: string; password: string; name: string } {
  const args = process.argv.slice(2);
  let email = "";
  let password = "";
  let name = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--email" && args[i + 1]) email = args[++i];
    else if (args[i] === "--password" && args[i + 1]) password = args[++i];
    else if (args[i] === "--name" && args[i + 1]) name = args[++i];
  }

  if (!email || !password || !name) {
    console.error(
      "Usage: pnpm db:create-admin --email <email> --password <password> --name <name>"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  return { email, password, name };
}

async function main() {
  const { email, password, name } = parseArgs();

  console.log(`Creating admin user: ${email}...`);

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`User with email ${email} already exists.`);
    process.exit(1);
  }

  // Use better-auth's sign-up API to create the user with properly hashed password
  const result = await auth.api.signUpEmail({
    body: { email, password, name },
    headers: new Headers(),
  });

  if (!result?.user?.id) {
    console.error("Failed to create user via better-auth.", result);
    process.exit(1);
  }

  // Promote to admin
  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: "admin" },
  });

  console.log(`Admin user created successfully!`);
  console.log(`  Name:  ${name}`);
  console.log(`  Email: ${email}`);
  console.log(`  Role:  admin`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
