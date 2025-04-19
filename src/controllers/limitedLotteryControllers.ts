import { Request, Response } from 'express';
import prisma from '../config/db';
import { Decimal } from '@prisma/client/runtime/library';
import { Connection } from '@solana/web3.js';

export const createLimitedLotteryController = async (req: Request, res: Response): Promise<void>  => {
    try {
        const {totalTickets, price, lotteryImage, lotteryName, lotterySymbol, lotteryURI } = req.body;

        if (!totalTickets || !price || !lotteryImage) {
            res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
            return;
        }


        const newLottery = await prisma.limitedLottery.create({
            data: {
                lotteryName: lotteryName,
                lotterySymbol: lotterySymbol,
                lotteryURI: lotteryURI,
                totalTickets: totalTickets,
                price: new Decimal(price),
                totalPotAmount: new Decimal(price * totalTickets),
                image: lotteryImage,
                winnerChosen: false,
            },
        });
        // console.log(newLottery);

        res.status(201).json({
            success: true,
            message: "Lottery created successfully",
            limitedLottery: newLottery,
        });

    } catch (error) {
        console.log('error in createLimitedLotteryController', error);
        res.status(500).send({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
}

export const getAllLimitedLottriesController = async(req: Request, res: Response): Promise<void> => {
    try {
        const lotteries = await prisma.limitedLottery.findMany({
            where: { status: "ACTIVE"},
            orderBy: { createdAt: 'desc' }, // Sort by newest first
            include: {
                ticketBought: {
                  select: {
                    ticketId: true,
                  },
                },
            },
        });

        const formattedLotteries = lotteries.map((lottery) => ({
            ...lottery,
            ticketBought: lottery.ticketBought.map((ticket) => ticket.ticketId),
        }));

        res.status(200).json({
            success: true,
            message: "Lotteries fetched successfully",
            lotteries: formattedLotteries,
        });
    } catch (error) {
        console.log('error in getAllLottriesController', error);
        res.status(500).send({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
}

export const buyLimitedLotteryTicketController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, signature: buyTicketSignature, publicKey} = req.body;

        if (!lotteryId || !publicKey || !buyTicketSignature) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }

        const lottery = await prisma.limitedLottery.findUnique({ where: { id: lotteryId } });

        if (!lottery) {
            res.status(404).json({ success: false, message: "Lottery not found" });
            return;
        }

        const existingTicket = await prisma.limitedLotteryTicket.findUnique({
            where:  { ticketSignature: buyTicketSignature } 
        });

        if (existingTicket) {
            res.status(400).json({ success: false, message: "Ticket signature already used" });
            return
        }

        const newTicket = await prisma.limitedLotteryTicket.create({
            data: {
                lotteryId,
                buyerPublicKey: publicKey,
                ticketSignature: buyTicketSignature,
                ticketId: req.body.ticketId,
            },
        });

        await prisma.limitedLottery.update({
            where: { id: lotteryId },
            data: { numberOfTicketSold: {increment: 1} },
        });

        res.status(201).json({
            success: true,
            message: "Ticket purchased successfully",
            ticket: newTicket,
        });

    } catch (error) {
        console.log('error in buyTicketController', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};


export const initializeLimitedLotteryConfigController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, initializeConfigSignature } = req.body;
        if (!lotteryId || !initializeConfigSignature) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }
        const lottery = await prisma.limitedLottery.findUnique({ where: { id: lotteryId } });
        if (!lottery) {
            res.status(404).json({ success: false, message: "Lottery not found" });
            return;
        }
        if(lottery.initializeConfigSignature){
            res.status(400).json({ success: false, message: "Config already initialized" });
            return;
        }

        await prisma.limitedLottery.update({
            where: { id: lotteryId },
            data: { initializeConfigSignature },
        });

        res.status(200).json({ success: true, lottery });
    } catch (error) {
        console.log('error in InitializeConfigController', error);
        res.status(500).json({ 
            success: false, 
            message: "Error initializing Config", 
            error 
        });
    }
};

export const initializeLimitedLotteryController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, initializeLotterySignature } = req.body;
        if (!lotteryId || !initializeLotterySignature) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }
        const lottery = await prisma.limitedLottery.findUnique({ where: { id: lotteryId } });
        if (!lottery) {
            res.status(404).json({ success: false, message: "Lottery not found" });
            return;
        }
        if(lottery.initializeLotterySignature){
            res.status(400).json({ success: false, message: "Lottery already initialized" });
            return;
        }

        await prisma.limitedLottery.update({
            where: { id: lotteryId },
            data: { initializeLotterySignature },
        });

        res.status(200).json({ success: true, lottery });
    } catch (error) {
        console.log('error in InitializeLotteryController', error);
        res.status(500).json({ 
            success: false, 
            message: "Error initializing lottery", 
            error 
        });
    }
};

export const createLimitedLotteryRandomnessController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, createRandomnessSignature, sbRandomnessPubKey, sbQueuePubKey } = req.body;
        if(!lotteryId || !createRandomnessSignature || !sbRandomnessPubKey || !sbQueuePubKey) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }
        const lottery = await prisma.limitedLottery.findUnique({ where: { id: lotteryId } });
        if (!lottery) {
            res.status(404).json({ success: false, message: "Lottery not found" });
            return;
        }

        await prisma.limitedLottery.update({
            where: { id: lotteryId },
            data: { createRandomnessSignature, sbRandomnessPubKey, sbQueuePubKey },
        });

        res.status(200).json({ 
            success: true, 
            lottery 
        });
    } catch (error) {
        console.log('error in createRandomnessController', error);
        res.status(500).json({ 
            success: false, 
            message: "Error creating randomness", 
            error 
        });
    }
};


export const getLimitedLotteryRandomnessKeysController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId } = req.params;
        if (!lotteryId) {
            res.status(400).json({ success: false, message: "Missing lotteryId" });
            return;
        }
        const lottery = await prisma.limitedLottery.findUnique({
            where: { id: parseInt(lotteryId) },
        });
        if (!lottery) {
            res.status(404).json({ success: false, message: "Lottery not found" });
            return;
        }
        const { sbRandomnessPubKey, sbQueuePubKey } = lottery;
        if (!sbRandomnessPubKey || !sbQueuePubKey) {
            res.status(404).json({ success: false, message: "Randomness keys not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Randomness keys fetched successfully",
            randomnessKeys: {
                sbRandomnessPubKey,
                sbQueuePubKey,
            },
        });
    } catch (error) {
        console.log('error in getRandomnessKeysController', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

export const commitLimitedLotteryRandomnessController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, commitRandomnessSignature } = req.body;
        if(!lotteryId || !commitRandomnessSignature) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }
        const lottery = await prisma.limitedLottery.findUnique({ where: { id: lotteryId } });
        if (!lottery) {
            res.status(404).json({ success: false, message: "Lottery not found" });
            return;
        }

        await prisma.limitedLottery.update({
            where: { id: lotteryId },
            data: { commitRandomnessSignature },
        });

        res.status(200).json({ 
            success: true, 
            lottery 
        });
    } catch (error) {
        console.log('error in commitRandomnessController', error);
        res.status(500).json({ 
            success: false, 
            message: "Error committing randomness", 
            error 
        });
    }
};

export const revealLimitedLotteryWinnerController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, revealWinnerSignature } = req.body;

        if(!lotteryId || !revealWinnerSignature) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }

        const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
        const connection = new Connection(SOLANA_RPC_URL, "confirmed");

        const transaction = await connection.getTransaction(revealWinnerSignature, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
        });

        if (!transaction) {
            res.status(400).json({ success: false, message: "Invalid transaction signature" });
            return;
        }

        const accountKeys = transaction.transaction.message.getAccountKeys();

        const instructionFound = transaction.transaction.message.compiledInstructions.some((ix) => {
            const programId = accountKeys.get(ix.programIdIndex)?.toBase58();
            return programId === process.env.LOTTERY_PROGRAM_ID;
        });

        if (!instructionFound) {
            res.status(400).json({ 
                success: false,
                message: "Instruction not found in transaction"
            });
            return;
        }

        const logMessage = transaction.meta?.logMessages?.find(log => log.includes("Winner Ticket"));
        // const ticketIdRegex = /([a-zA-Z\s]+) #(\d+)-(\d+)/;
        const ticketRegex = /Winner Ticket\s*:\s*([\w\s]+)#(\d+)-(\d+)/;
        const match = logMessage?.match(ticketRegex);
        // console.log(match);

        if (!match) {
            res.status(400).json({ success: false, message: "Invalid ticket ID format in logs" });
            return;
        }

        const lotteryName = match[1].trim();
        const currentLotteryId = parseInt(match[2]);        
        const ticketNumber = parseInt(match[3]);
        const ticketId = `${lotteryName} #${currentLotteryId}-${ticketNumber}`;

        // console.log(ticketId);

        const ticket = await prisma.limitedLotteryTicket.findUnique({
            where: { ticketId },
        });
        // console.log(ticket);

        if (!ticket) {
            res.status(404).json({ success: false, message: "Ticket not found" });
            return;
        }

        const winnerPublicKey = ticket.buyerPublicKey;

        const lottery = await prisma.limitedLottery.update({
            where: { id: lotteryId },
            data: {
                winnerChosen: true,
                winnerPublicKey: winnerPublicKey,
                winnerTicketId: ticketId,  
                revealWinnerSignature,
                winnerDeclaredTime: new Date(),
            },
        });

        res.status(200).json({ 
            success: true, 
            lottery 
        });
    } catch (error) {
        console.log('error in revealWinnerController', error);
        res.status(500).json({ 
            success: false, 
            message: "Error revealing winner", 
            error 
        });
    }
};

export const claimLimitedLotteryWinningsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, publicKey: claimantPublicKey, signature: priceClaimedSignature } = req.body;
        if (!lotteryId || !claimantPublicKey || !priceClaimedSignature) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }

        const lottery = await prisma.limitedLottery.findUnique({ where: { id: lotteryId } });

        if (!lottery) {
            res.status(404).json({ success: false, message: "Lottery not found" });
            return;
        }

        // if (lottery.winnerPublicKey !== claimantPublicKey) {
        //     res.status(403).json({ success: false, message: "You are not the winner" });
        //     return;
        // }

        if (lottery.priceClaimed) {
            res.status(400).json({ success: false, message: "Prize already claimed" });
            return;
        }

        if(lottery.winnerTicketId !== req.body.ticketId) {
            res.status(400).json({ success: false, message: "Ticket ID does not match winner's ticket" });
            return;
        }

        await prisma.limitedLottery.update({
            where: { id: lotteryId },
            data: { 
                priceClaimed: true, 
                winnerPublicKey: claimantPublicKey,
                priceClaimedSignature, 
                priceClaimedTime: new Date()
            },
        });

        res.status(200).json({ 
            success: true, 
            message: "Prize claimed successfully" 
        });
    } catch (error) {
        console.log('error in claimWinningsController', error);
        res.status(500).json({ 
            success: false, 
            message: "Error revealing winner", 
            error 
        });
    }
}

export const limitedLotteryAuthorityWinningsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, publicKey: claimantPublicKey, signature: priceClaimedSignature } = req.body;
        if (!lotteryId || !claimantPublicKey || !priceClaimedSignature) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }

        const lottery = await prisma.limitedLottery.findUnique({ where: { id: lotteryId } });

        if (!lottery) {
            res.status(404).json({ success: false, message: "Lottery not found" });
            return;
        }

        if (process.env.ADMIN_PUBLIC_KEY !== claimantPublicKey) {
            res.status(403).json({ success: false, message: "You are not the authority" });
            return;
        }

        if (lottery.authorityPriceClaimed) {
            res.status(400).json({ success: false, message: "authority already claimed money" });
            return;
        }

        await prisma.limitedLottery.update({
            where: { id: lotteryId },
            data: { 
                authorityPriceClaimed: true,
                authorityPriceClaimedSignature: priceClaimedSignature, 
                authorityPriceClaimedTime: new Date() 
            },
        });

        res.status(200).json({ 
            success: true, 
            message: "Prize claimed successfully" 
        });
    } catch (error) {
        console.log('error in authorityWinningsController', error);
        res.status(500).json({ 
            success: false, 
            message: "Error revealing winner", 
            error 
        });
    }
};

export const completeLotteryController = async (req: Request, res: Response): Promise<void> => {
    const { lotteryId } = req.body;
  
    try {
      const lottery = await prisma.limitedLottery.findUnique({
        where: { id: parseInt(lotteryId, 10) },
      });
  
      if (!lottery) {
        res.status(404).json({ message: 'Lottery not found' });
        return;
      }
  
      if (
        lottery.winnerChosen &&
        lottery.priceClaimed &&
        lottery.authorityPriceClaimed
      ) {
        const updatedLottery = await prisma.limitedLottery.update({
          where: { id: lottery.id },
          data: { status: 'COMPLETED' },
        });
  
        res.status(200).json({
            success: true,
          message: 'Lottery status updated to COMPLETED',
          lottery: updatedLottery,
        });
        return;
      }
  
      res.status(400).json({
        success: false,
        message: 'Cannot complete the lottery. Ensure winner chosen, price claimed by winner and authority.',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error'
      });
    }
};