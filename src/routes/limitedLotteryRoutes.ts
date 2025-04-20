import express from "express";

import { verifyUserToken } from "../middlewares/authMiddleware";
import { verifySolanaTransaction } from "../middlewares/verifySignatureMiddleware";
import { buyLimitedLotteryTicketController, 
    claimLimitedLotteryWinningsController, 
    commitLimitedLotteryRandomnessController, 
    completeLotteryController, 
    createLimitedLotteryController, 
    createLimitedLotteryRandomnessController, 
    deleteLimitedLotteryController, 
    getAllLimitedLottriesController, 
    getLimitedLotteryRandomnessKeysController, 
    initializeLimitedLotteryConfigController, 
    initializeLimitedLotteryController, 
    limitedLotteryAuthorityWinningsController, 
    revealLimitedLotteryWinnerController 
} from "../controllers/limitedLotteryControllers";

const router = express.Router();

router.post("/create-limited-lottery", verifyUserToken, createLimitedLotteryController);

router.get("/get-all-limited-lotteries", getAllLimitedLottriesController);

router.post("/buy-limited-lottery-ticket", verifySolanaTransaction("BuyLimitedLotteryTickets"), buyLimitedLotteryTicketController);

router.post("/initialize-limited-lottery-config", verifyUserToken, initializeLimitedLotteryConfigController);

router.post("/initialize-limited-lottery", verifyUserToken, initializeLimitedLotteryController);

router.put("/create-limited-lottery-randomness", verifyUserToken, createLimitedLotteryRandomnessController);

router.get("/get-limited-lottery-randomness-keys/:lotteryId", verifyUserToken, getLimitedLotteryRandomnessKeysController);

router.put("/commit-limited-lottery-randomness", verifyUserToken, commitLimitedLotteryRandomnessController);

router.put("/reveal-limited-lottery-winner", verifyUserToken, revealLimitedLotteryWinnerController);

router.put("/claim-limited-lottery-winnings", verifySolanaTransaction("ClaimLimitedLotteryWinnings"), claimLimitedLotteryWinningsController);

router.put("/limited-lottery-authority-transfer", verifyUserToken, limitedLotteryAuthorityWinningsController);

router.put("/update-lottery-status", verifyUserToken, completeLotteryController);

router.delete("/delete-lottery/:id", verifyUserToken, deleteLimitedLotteryController);

export default router;