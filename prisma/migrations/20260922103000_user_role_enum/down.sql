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
-- Prisma does not run this automatically. Apply by hand, then delete the
-- migration row so the history matches:
--   psql "$DATABASE_URL" -f down.sql
--   psql "$DATABASE_URL" -c "DELETE FROM _prisma_migrations WHERE migration_name = '20260922103000_user_role_enum';"

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE text USING ("role"::text);
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
DROP TYPE "UserRole";
