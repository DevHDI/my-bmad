-- Convert "users"."role" from text to a database-level enum.
--
-- Written by hand: `prisma migrate dev` generates a DROP COLUMN / ADD COLUMN
-- pair for a String -> enum conversion, which would discard every existing role.

-- Any value outside the enum would abort the cast below. Demote it first:
-- "user" is the fail-closed choice, never "admin".
UPDATE "users" SET "role" = 'user' WHERE "role" NOT IN ('user', 'admin');

CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- Postgres refuses to retype a column while a text default is still attached.
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::"UserRole");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
