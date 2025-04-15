-- CreateTable
CREATE TABLE "Nonce" (
    "id" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lottery" (
    "id" SERIAL NOT NULL,
    "lotteryName" TEXT NOT NULL,
    "lotterySymbol" TEXT NOT NULL,
    "lotteryURI" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "potAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalTickets" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT NOT NULL,
    "winnerChosen" BOOLEAN NOT NULL DEFAULT false,
    "winnerPublicKey" TEXT,
    "winnerTicketId" TEXT,
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

    CONSTRAINT "Lottery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
    "lotteryId" INTEGER NOT NULL,
    "ticketId" TEXT NOT NULL,
    "buyerPublicKey" TEXT NOT NULL,
    "ticketSignature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nonce_publicKey_key" ON "Nonce"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketId_key" ON "Ticket"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketSignature_key" ON "Ticket"("ticketSignature");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_lotteryId_fkey" FOREIGN KEY ("lotteryId") REFERENCES "Lottery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
