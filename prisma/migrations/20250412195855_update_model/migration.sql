/*
  Warnings:

  - You are about to drop the `LimitedLotteryDetails` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LimitedLotteryDetails" DROP CONSTRAINT "LimitedLotteryDetails_lotteryId_fkey";

-- AlterTable
ALTER TABLE "LimitedLottery" ADD COLUMN     "authorityPriceClaimedSignature" TEXT,
ADD COLUMN     "authorityPriceClaimedTime" TIMESTAMP(3),
ADD COLUMN     "commitRandomnessSignature" TEXT,
ADD COLUMN     "createRandomnessSignature" TEXT,
ADD COLUMN     "initializeConfigSignature" TEXT,
ADD COLUMN     "initializeLotterySignature" TEXT,
ADD COLUMN     "priceClaimedSignature" TEXT,
ADD COLUMN     "priceClaimedTime" TIMESTAMP(3),
ADD COLUMN     "revealWinnerSignature" TEXT,
ADD COLUMN     "sbQueuePubKey" TEXT,
ADD COLUMN     "sbRandomnessPubKey" TEXT,
ADD COLUMN     "winnerDeclaredTime" TIMESTAMP(3);

-- DropTable
DROP TABLE "LimitedLotteryDetails";
