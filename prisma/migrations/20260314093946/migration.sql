-- CreateEnum
CREATE TYPE "ResultType" AS ENUM ('NORMAL', 'OVERTIME', 'TIEBREAKER');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "result_type" "ResultType" NOT NULL DEFAULT 'NORMAL';
