import { Request, Response } from 'express';
import prisma from '../config/db';
import { Decimal } from '@prisma/client/runtime/library';
import { Connection } from '@solana/web3.js';


export const createLotteryController = async (req: Request, res: Response): Promise<void>  => {
    try {
        const { startTime, endTime, price, lotteryImage, lotteryName, lotterySymbol, lotteryURI } = req.body;

        if (!startTime || !endTime || !price || !lotteryImage) {
            res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
            return;
        }

        if(startTime > endTime) {
            res.status(400).json({
                success: false,
                message: "Start time cannot be greater than end time",
            });
            return;
        }

        const newLottery = await prisma.lottery.create({
            data: {
                lotteryName: lotteryName,
                lotterySymbol: lotterySymbol,
                lotteryURI: lotteryURI,
                startTime: startTime,
                endTime: endTime,
                price: new Decimal(price),
                potAmount: new Decimal(0),
                totalTickets: 0,
                image: lotteryImage,
                winnerChosen: false,
            },
        });
        // console.log(newLottery);

        res.status(201).json({
            success: true,
            message: "Lottery created successfully",
            lottery: {
                ...newLottery,
                startTime: newLottery.startTime.toString(), 
                endTime: newLottery.endTime.toString(), 
                price: newLottery.price.toNumber(), 
                potAmount: newLottery.potAmount.toNumber()
            },
        });

    } catch (error) {
        console.log('error in createLotteryController', error);
        res.status(500).send({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
}

export const getAllLottriesController = async(req: Request, res: Response): Promise<void> => {
    try {
        const lotteries = await prisma.lottery.findMany({
            where: { status: "ACTIVE"},
            orderBy: { createdAt: 'desc' }, // Sort by newest first
        });

        res.status(200).json({
            success: true,
            message: "Lotteries fetched successfully",
            lotteries,
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


// export const getAllLottriesForAdminController = async(req: Request, res: Response): Promise<void> => {
//     try {
//         const lotteries = await prisma.lottery.findMany({
//             orderBy: { createdAt: 'desc' }, // Sort by newest first
//         });

//         const formattedLotteries = lotteries.map(lottery => ({
//             ...lottery,
//             startTime: lottery.startTime.toString(),
//             endTime: lottery.endTime.toString(),
//             price: lottery.price.toNumber(),
//             potAmount: lottery.potAmount.toNumber(),
//         }));

//         res.status(200).json({
//             success: true,
//             message: "Lotteries fetched successfully",
//             lotteries: formattedLotteries,
//         });
//     } catch (error) {
//         res.status(500).send({
//             success: false,
//             message: "Internal server error",
//             error: error,
//         });
//     }
// }

export const getSingleLotteryController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const lottery = await prisma.lottery.findUnique({ where: { id : parseInt(id) } });
        // console.log(lottery);
        

        if(!lottery) {
            res.status(404).json({
                success: false,
                message: "Lottery not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Lottery fetched successfully",
            lottery: {
                ...lottery,
                // startTime: lottery.startTime.toString(),
                // endTime: lottery.endTime.toString(),
                // price: lottery.price.toNumber(),
                // potAmount: lottery.potAmount.toNumber(),
            },
        });
    } catch (error) {
        console.log('error in getSingleLotteryController', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
        
    }
}

export const buyTicketController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, signature: buyTicketSignature, publicKey} = req.body;

        if (!lotteryId || !publicKey || !buyTicketSignature) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }

        const lottery = await prisma.lottery.findUnique({ where: { id: lotteryId } });

        if (!lottery) {
            res.status(404).json({ success: false, message: "Lottery not found" });
            return;
        }

        const existingTicket = await prisma.ticket.findUnique({
            where:  { ticketSignature: buyTicketSignature } 
        });

        if (existingTicket) {
            res.status(400).json({ success: false, message: "Ticket signature already used" });
            return
        }

        const newTicket = await prisma.ticket.create({
            data: {
                lotteryId,
                buyerPublicKey: publicKey,
                ticketSignature: buyTicketSignature,
                ticketId: req.body.ticketId,
            },
        });

        await prisma.lottery.update({
            where: { id: lotteryId },
            data: { totalTickets: { increment: 1 }, potAmount: {increment: lottery.price} },
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


export const InitializeConfigController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, initializeConfigSignature } = req.body;
        if (!lotteryId || !initializeConfigSignature) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }
        const lottery = await prisma.lottery.findUnique({ where: { id: lotteryId } });
        if (!lottery) {
            res.status(404).json({ success: false, message: "Lottery not found" });
            return;
        }
        if(lottery.initializeConfigSignature) {
            res.status(400).json({ success: false, message: "Config already initialized" });
            return;
        }

        prisma.lottery.update({
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

export const InitializeLotteryController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, initializeLotterySignature } = req.body;
        if (!lotteryId || !initializeLotterySignature) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }
        const lottery = await prisma.lottery.findUnique({ where: { id: lotteryId } });
        if (!lottery) {
            res.status(404).json({ success: false, message: "Lottery not found" });
            return;
        }
        if(lottery.initializeLotterySignature) {
            res.status(400).json({ success: false, message: "Lottery already initialized" });
            return;
        }
        await prisma.lottery.update({
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

export const createRandomnessController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, createRandomnessSignature, sbRandomnessPubKey, sbQueuePubKey } = req.body;
        if(!lotteryId || !createRandomnessSignature || !sbRandomnessPubKey || !sbQueuePubKey) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }

        const lottery = await prisma.lottery.update({
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

export const getRandomnessKeysController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId } = req.params;
        if (!lotteryId) {
            res.status(400).json({ success: false, message: "Missing lotteryId" });
            return;
        }
        const lottery = await prisma.lottery.findUnique({
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

export const commitRandomnessController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, commitRandomnessSignature } = req.body;

        const lottery = await prisma.lottery.update({
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

export const revealWinnerController = async (req: Request, res: Response): Promise<void> => {
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
        const ticketRegex = /Winner Ticket\s*:\s*([\w\s]+)#(\d+)-(\d+)/;
        const match = logMessage?.match(ticketRegex);

        if (!match) {
            res.status(400).json({ success: false, message: "Invalid ticket ID format in logs" });
            return;
        }

        const lotteryName = match[1].trim();
        const currentLotteryId = parseInt(match[2]);        
        const ticketNumber = parseInt(match[3]);
        const ticketId = `${lotteryName} #${currentLotteryId}-${ticketNumber}`;

        const ticket = await prisma.ticket.findUnique({
            where: { ticketId },
        });
        // console.log(ticket);

        if (!ticket) {
            res.status(404).json({ success: false, message: "Ticket not found" });
            return;
        }

        const winnerPublicKey = ticket.buyerPublicKey;
        // console.log(winnerPublicKey);

        // Update the lottery with the winner's details
        const lottery = await prisma.lottery.update({
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

export const updateWinnerController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId,  ticketId } = req.body;
        if (!lotteryId || !ticketId) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }
        const lottery = await prisma.lottery.findUnique({ where: { id: lotteryId } });
        if (!lottery) {
            res.status(404).json({ success: false, message: "Lottery not found" });
            return;
        }
        const ticket = await prisma.ticket.findUnique({ where: { ticketId } });
        if (!ticket) {
            res.status(404).json({ success: false, message: "Ticket not found" });
            return;
        }

        const winnerPublicKey = ticket.buyerPublicKey;
        const updatedLottery = await prisma.lottery.update({
            where: { id: lotteryId },
            data: {
                winnerChosen: true,
                winnerPublicKey: winnerPublicKey,
                winnerTicketId: ticketId,
                winnerDeclaredTime: new Date(),
            },
        });
        res.status(200).json({
            success: true,
            message: "Winner updated successfully",
            lottery: updatedLottery,
        });
    } catch (error) {
        console.log('error in updateWinnerController', error);
        res.status(500).json({
            success: false,
            message: "Error updating winner",
            error,
        });
    }
};

export const claimWinningsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, publicKey: claimantPublicKey, signature: priceClaimedSignature } = req.body;

        const lottery = await prisma.lottery.findUnique({ where: { id: lotteryId } });

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

        await prisma.lottery.update({
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

export const authorityWinningsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lotteryId, publicKey: claimantPublicKey, signature: priceClaimedSignature } = req.body;

        const lottery = await prisma.lottery.findUnique({ where: { id: lotteryId } });

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

        await prisma.lottery.update({
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

export const getWinnerByPublicKeyController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { publicKey } = req.params;

        if (!publicKey) {
            res.status(400).json({ success: false, message: "Missing publicKey in request body" });
            return;
        }

        const lotteries = await prisma.lottery.findMany({
            where: { winnerPublicKey: publicKey },
        });

        const limitedLotteries = await prisma.limitedLottery.findMany({
            where: { winnerPublicKey: publicKey },
        });

        const allWinnings = [
            ...lotteries.map((lottery) => ({
              id: lottery.id,
              lotteryName: lottery.lotteryName,
              lotterySymbol: lottery.lotterySymbol,
              lotteryURI: lottery.lotteryURI,
              price: lottery.price,
              winnings: lottery.potAmount.mul(new Decimal(0.9)),
              winnerPublicKey: lottery.winnerPublicKey,
              winnerTicketId: lottery.winnerTicketId,
              priceClaimed: lottery.priceClaimed || false,
              priceClaimedSignature: lottery.priceClaimedSignature || null,
              priceClaimedTime: lottery.priceClaimedTime || null,
              lotteryType: "regular"
            })),
      
            ...limitedLotteries.map((lottery) => ({
              id: lottery.id,
              lotteryName: lottery.lotteryName,
              lotterySymbol: lottery.lotterySymbol,
              lotteryURI: lottery.lotteryURI,
              price: lottery.price,
              winnings: lottery.totalPotAmount,
              winnerPublicKey: lottery.winnerPublicKey,
              winnerTicketId: lottery.winnerTicketId,
              priceClaimed: lottery.priceClaimed || false,
              priceClaimedSignature: lottery.priceClaimedSignature || null,
              priceClaimedTime: lottery.priceClaimedTime || null,
              lotteryType: "limited"
            })),
        ];


        if (allWinnings.length === 0) {
            res.status(404).json({ success: false, message: "No lotteries found for this public key" });
            return;
        }

        // Divide the lotteries into two categories based on the priceClaimed field
        const currentWinnings = allWinnings.filter(lottery => !lottery.priceClaimed);
        const previousWinnings = allWinnings.filter(lottery => lottery.priceClaimed);

        res.status(200).json({
            success: true,
            message: "Winner lotteries fetched successfully",
            currentWinnings: {
                count: currentWinnings.length, // Count of current winnings
                lotteries: currentWinnings,
            },
            previousWinnings: {
                count: previousWinnings.length, // Count of previous winnings
                lotteries: previousWinnings,
            },
        });
    } catch (error) {
        console.log('error in getWinnerByPublicKeyController', error);
        res.status(500).json({
            success: false,
            message: "Error fetching lottery information",
            error,
        });
    }
};

export const completeLotteryController = async (req: Request, res: Response): Promise<void> => {
    const { lotteryId } = req.body;
  
    try {
      const lottery = await prisma.lottery.findUnique({
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
        const updatedLottery = await prisma.lottery.update({
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