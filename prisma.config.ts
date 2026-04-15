import "dotenv/config";
import { defineConfig } from "prisma/config";

const PLACEHOLDER_DATABASE_URL =
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";
const isGenerateCommand = process.argv.includes("generate");
const databaseUrl =
  process.env.DATABASE_URL ??
  (isGenerateCommand ? PLACEHOLDER_DATABASE_URL : undefined);

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required for Prisma commands other than `prisma generate`.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  // Fresh installs can run `prisma generate` before a local `.env` exists.
  datasource: {
    url: databaseUrl,
  },
});
