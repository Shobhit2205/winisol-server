import express from "express";
import { getNonce, sendMailController, verifyAdminController } from "../controllers/authControllers";

const router = express.Router();

router.post('/generate-nonce', getNonce);
router.post('/verify-authority', verifyAdminController);

router.post('/send-mail', sendMailController);

export default router;