-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Video"
  ADD COLUMN     "status" "GenerationStatus" NOT NULL DEFAULT 'QUEUED',
  ADD COLUMN     "jobId" TEXT,
  ADD COLUMN     "errorMessage" TEXT,
  ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN   "videoUrl" DROP NOT NULL;

ALTER TABLE "Mux"
  ADD COLUMN     "status" "GenerationStatus" NOT NULL DEFAULT 'QUEUED',
  ADD COLUMN     "jobId" TEXT,
  ADD COLUMN     "errorMessage" TEXT,
  ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN   "finalvideoUrl" DROP NOT NULL;

-- Mark existing assets as completed
UPDATE "Video" SET "status" = 'COMPLETED' WHERE "videoUrl" IS NOT NULL;
UPDATE "Mux" SET "status" = 'COMPLETED' WHERE "finalvideoUrl" IS NOT NULL;
