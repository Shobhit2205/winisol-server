/*
  Warnings:

  - You are about to drop the column `ticketBought` on the `LimitedLottery` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LimitedLottery" DROP COLUMN "ticketBought",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "LimitedLotteryTicket" (
    "id" SERIAL NOT NULL,
    "lotteryId" INTEGER NOT NULL,
    "ticketId" TEXT NOT NULL,
    "buyerPublicKey" TEXT NOT NULL,
    "ticketSignature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LimitedLotteryTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimitedLotteryDetails" (
    "id" SERIAL NOT NULL,
    "lotteryId" INTEGER NOT NULL,
    "sbRandomnessPubKey" TEXT,
    "sbQueuePubKey" TEXT,
    "winnerDeclaredTime" TIMESTAMP(3),
    "initializeConfigSignature" TEXT,
    "initializeLotterySignature" TEXT,
    "createRandomnessSignature" TEXT,
    "commitRandomnessSignature" TEXT,
    "revealWinnerSignature" TEXT,
    "priceClaimed" BOOLEAN NOT NULL DEFAULT false,
    "priceClaimedSignature" TEXT,
    "priceClaimedTime" TIMESTAMP(3),
    "authorityPriceClaimedSignature" TEXT,
    "authorityPriceClaimed" BOOLEAN NOT NULL DEFAULT false,
    "authorityPriceClaimedTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LimitedLotteryDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LimitedLotteryTicket_ticketId_key" ON "LimitedLotteryTicket"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "LimitedLotteryTicket_ticketSignature_key" ON "LimitedLotteryTicket"("ticketSignature");

-- CreateIndex
CREATE INDEX "LimitedLotteryTicket_lotteryId_ticketId_buyerPublicKey_idx" ON "LimitedLotteryTicket"("lotteryId", "ticketId", "buyerPublicKey");

-- CreateIndex
CREATE INDEX "LimitedLotteryDetails_lotteryId_idx" ON "LimitedLotteryDetails"("lotteryId");

-- CreateIndex
CREATE INDEX "Ticket_lotteryId_ticketId_buyerPublicKey_idx" ON "Ticket"("lotteryId", "ticketId", "buyerPublicKey");

-- AddForeignKey
ALTER TABLE "LimitedLotteryTicket" ADD CONSTRAINT "LimitedLotteryTicket_lotteryId_fkey" FOREIGN KEY ("lotteryId") REFERENCES "LimitedLottery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimitedLotteryDetails" ADD CONSTRAINT "LimitedLotteryDetails_lotteryId_fkey" FOREIGN KEY ("lotteryId") REFERENCES "LimitedLottery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
