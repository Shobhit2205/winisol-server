/*
  Warnings:

  - You are about to drop the column `number_of_ticket_sold` on the `LimitedLottery` table. All the data in the column will be lost.
  - You are about to drop the column `ticket_bought` on the `LimitedLottery` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LimitedLottery" DROP COLUMN "number_of_ticket_sold",
DROP COLUMN "ticket_bought",
ADD COLUMN     "numberOfTicketSold" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ticketBought" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
