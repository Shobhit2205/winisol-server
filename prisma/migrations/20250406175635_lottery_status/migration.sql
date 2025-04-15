-- CreateEnum
CREATE TYPE "LotteryStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "Lottery" ADD COLUMN     "status" "LotteryStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Lottery_status_idx" ON "Lottery"("status");
