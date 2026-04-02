-- AlterTable
ALTER TABLE "repos" ADD COLUMN     "localPath" TEXT,
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'github';
