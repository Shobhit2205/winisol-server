import { Request, Response, NextFunction } from "express";
import { Connection } from "@solana/web3.js";

export const verifySolanaTransaction = (instructionType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { signature, publicKey, lotteryId } = req.body;

        if (!signature || !publicKey) {
            res.status(400).json({ success: false, message: "Missing required fields" });
            return;
        }

        const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
        const connection = new Connection(SOLANA_RPC_URL, "confirmed");

        const transaction = await connection.getTransaction(signature, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
        });

        if (!transaction) {
            res.status(400).json({ success: false, message: "Invalid transaction signature" });
            return;
        }

        // Verify sender matches the provided public key
        const transactionSender = transaction.transaction.message.getAccountKeys().get(0)?.toBase58();

        if (transactionSender !== publicKey) {
            res.status(403).json({ success: false, message: "Signature does not match public key" });
            return;
        }

        const accountKeys = transaction.transaction.message.getAccountKeys();

        const instructionFound = transaction.transaction.message.compiledInstructions.some((ix) => {
            const programId = accountKeys.get(ix.programIdIndex)?.toBase58();
            return programId === process.env.LOTTERY_PROGRAM_ID;
        });

        const actionFound = transaction.meta?.logMessages?.some(log =>
            log.includes(`Instruction: ${instructionType}`)
        );

        if (!instructionFound || !actionFound) {
            res.status(400).json({ success: false, message: `Transaction is not for ${instructionType}` });
            return;
        }

        const logMessage = transaction.meta?.logMessages?.find(log => log.includes("Ticket Id"));
        const ticketRegex = /Ticket Id\s*:\s*([\w\s]+)#(\d+)-(\d+)/;
        const match = logMessage?.match(ticketRegex);


        if(!match) {
            res.status(400).json({ success: false, message: "Invalid log message format" });
            return;
        }
        
        const lotteryName = match[1].trim();
        const currentLotteryId = parseInt(match[2]);        
        const ticketNumber = parseInt(match[3]);

        if(currentLotteryId !== lotteryId) {
            res.status(400).json({ success: false, message: "Lottery ID does not match" });
            return;
        }
        req.body.ticketId = `${lotteryName} #${currentLotteryId}-${ticketNumber}`;

        next();
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Internal server error", 
            error 
        });
    }
  };
};
