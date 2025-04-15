import { Request, Response } from "express";
import JWT from "jsonwebtoken"
import crypto from "crypto";
import prisma from "../config/db";
import nacl from "tweetnacl";
import bs58 from 'bs58'
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    host: "mail.spacemail.com", 
    port: 465, 
    secure: true,
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
});

export const getNonce = async (req: Request, res: Response): Promise<void> => {
    try {
        const { publicKey } = req.body;
        const NONCE_EXPIRY_MINUTES = 5;

        if (!publicKey) {
            res.status(400).json({ success: false, message: "Public key required" });
            return;
        }

        if (publicKey !== process.env.ADMIN_PUBLIC_KEY) {
            res.status(403).json({ success: false, message: "Unauthorized" });
            return;
        }

        // Generate nonce
        const nonce = crypto.randomBytes(16).toString("hex");
        const expiresAt = new Date(Date.now() + NONCE_EXPIRY_MINUTES * 60 * 1000);

        await prisma.nonce.upsert({
            where: { publicKey },
            update: { nonce, expiresAt },
            create: { publicKey, nonce, expiresAt },
        });

        res.status(200).json({ success: true, nonce, expiresAt });
    } catch (error) {
        console.log("Error in generating nonce", error);
        res.status(500).send({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
}

export const verifyAdminController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { publicKey, signature } = req.body;

        if (!publicKey || !signature) {
            res.status(400).json({ success: false, message: "Missing data" });
            return 
        }

        if (publicKey !== process.env.ADMIN_PUBLIC_KEY) {
            res.status(403).json({ success: false, message: "Unauthorized" });
            return;
        }

        const nonceEntry = await prisma.nonce.findUnique({ where: { publicKey } });

        if (!nonceEntry) {
            res.status(400).json({ success: false, message: "Nonce expired or invalid" });
            return;
        }

        if (new Date() > nonceEntry.expiresAt) {
            await prisma.nonce.delete({ where: { publicKey } });
            res.status(400).json({ success: false, message: "Nonce expired" });
            return;
        }


        const isVerified = nacl.sign.detached.verify(
            new TextEncoder().encode(nonceEntry.nonce), 
            bs58.decode(signature),
            bs58.decode(publicKey)
        );
        

        if (!isVerified) {
            res.status(401).json({ success: false, message: "Invalid signature" });
            return
        }

        const token = JWT.sign({ publicKey }, process.env.JWT_SECRET || "winisol", { expiresIn: "1h" });

        res.status(200).json({
            success: true,
            message: "Admin authenticated",
            token,
        });

    } catch (error: any) {
        console.log("Error in verifying autority", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server error", 
            error: error.message 
        });
    }
};

export const sendMailController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            res.status(400).json({ success: false, message: "Missing data" });
            return;
        }

        const mailOptions = {
            from: 'WiniSol <contact@winisol.com>',
            to: process.env.RECEIVER_EMAIL,
            subject: `New Contact Form Submission from ${name}`,
            text: `You have received a new message from ${name} (${email}):\n\n${message}`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: "Email sent successfully" });
    } catch (error) {
        console.log("Error in sending email", error);
        res.status(500).send({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
}