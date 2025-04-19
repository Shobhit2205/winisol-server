import express from "express";
import { findLotteryWinnerByPublicKey, getAllWinnersController } from "../controllers/commonLotteryController";

const router = express.Router();

router.get("/winner-by-public-key/:publicKey", findLotteryWinnerByPublicKey)

router.get('/get-all-winners', getAllWinnersController)

export default router;
