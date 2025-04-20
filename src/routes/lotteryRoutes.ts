import express from "express";
import {
  authorityWinningsController,
  buyTicketController,
  claimWinningsController,
  commitRandomnessController,
  completeLotteryController,
  createLotteryController,
  createRandomnessController,
  deleteLotteryController,
  getAllLottriesController,
  getRandomnessKeysController,
  getSingleLotteryController,
  getWinnerByPublicKeyController,
  InitializeConfigController,
  InitializeLotteryController,
  revealWinnerController,
  updateWinnerController,
} from "../controllers/lotteryControllers";
import { verifyUserToken } from "../middlewares/authMiddleware";
import { verifySolanaTransaction } from "../middlewares/verifySignatureMiddleware";

const router = express.Router();

router.post("/create-lottery", verifyUserToken, createLotteryController);
router.get("/get-all-lotteries", getAllLottriesController);

// router.get("/get-all-lotteries-for-admin", verifyUserToken, getAllLottriesForAdminController);
router.get('/get-single-lottery/:id', verifyUserToken, getSingleLotteryController);
router.post("/buy-ticket", verifySolanaTransaction("BuyTickets"), buyTicketController);

router.post("/initialize-config", verifyUserToken, InitializeConfigController);
router.post("/initialize-lottery", verifyUserToken, InitializeLotteryController);
router.put("/create-randomness", verifyUserToken, createRandomnessController);
router.get("/get-randomness-keys/:lotteryId", verifyUserToken, getRandomnessKeysController);
router.put("/commit-randomness", verifyUserToken, commitRandomnessController);
router.put("/reveal-winner", verifyUserToken, revealWinnerController);
router.put('/update-winner-if-needed', verifyUserToken, updateWinnerController)
router.put("/claim-winnings", verifySolanaTransaction("ClaimWinnings"), claimWinningsController);
router.put("/authority-transfer", verifyUserToken, authorityWinningsController);
router.get("/get-winner-by-publicKey/:publicKey", getWinnerByPublicKeyController);
router.put("/update-lottery-status", verifyUserToken, completeLotteryController)
router.delete("/delete-lottery/:id", verifyUserToken, deleteLotteryController);

export default router;
