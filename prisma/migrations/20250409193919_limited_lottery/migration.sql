-- CreateTable
CREATE TABLE "LimitedLottery" (
    "id" SERIAL NOT NULL,
    "lotteryName" TEXT NOT NULL,
    "lotterySymbol" TEXT NOT NULL,
    "lotteryURI" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "totalPotAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalTickets" INTEGER NOT NULL DEFAULT 0,
    "ticket_bought" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "number_of_ticket_sold" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT NOT NULL,
    "status" "LotteryStatus" NOT NULL DEFAULT 'ACTIVE',
    "winnerChosen" BOOLEAN NOT NULL DEFAULT false,
    "winnerPublicKey" TEXT,
    "winnerTicketId" TEXT,
    "priceClaimed" BOOLEAN NOT NULL DEFAULT false,
    "authorityPriceClaimed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LimitedLottery_pkey" PRIMARY KEY ("id")
);
