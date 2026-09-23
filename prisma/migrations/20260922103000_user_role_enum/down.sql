-- Rollback for 20260922103000_user_role_enum.
--
-- REQUIRED before rolling the application back past this migration. A Prisma
-- client generated from the previous schema (role String) cannot even *read*
-- the enum column: findMany fails with
--   P2032  Error converting field "role" of expected non-nullable type
--          "String", found incompatible value of "admin"
-- Since getAuthenticatedSession selects role on every authenticated request,
-- leaving the enum in place while running the old code takes the whole app
-- down, not just role management.
--
-- Prisma does not run this automatically. Apply it by hand, as ONE command:
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f down.sql
--
-- Both flags matter. Without ON_ERROR_STOP, psql carries on after a failed
-- statement and would still drop the history row below, leaving the schema and
-- _prisma_migrations disagreeing — the worst state to discover mid-incident.
-- Without --single-transaction, a partial rollback stays applied. Every
-- statement here is transactional in Postgres, so the pair gives all-or-nothing.

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE text USING ("role"::text);
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
DROP TYPE "UserRole";

-- Kept in the same transaction as the schema change on purpose: the history
-- must never say "applied" once the column is back to text.
DELETE FROM _prisma_migrations WHERE migration_name = '20260922103000_user_role_enum';
