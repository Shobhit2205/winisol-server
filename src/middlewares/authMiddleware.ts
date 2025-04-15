import { Request, Response, NextFunction } from "express";
import JWT from "jsonwebtoken";


interface AuthRequest extends Request {
    user?: { publicKey: string };
}

export const verifyUserToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1]; 

        if (!token) {
            res.status(401).json({ success: false, message: "Access Denied. No token provided." });
            return;
        }

        const decoded = JWT.verify(token, process.env.JWT_SECRET || "winisol") as { publicKey: string };

        req.user = { publicKey: decoded.publicKey };

        next(); 
    } catch (error) {
        res.status(403).json({ success: false, message: "Invalid or expired token." });
    }
};
