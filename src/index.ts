import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import lotteryRoutes from './routes/lotteryRoutes';
import authRoutes from './routes/authRoutes';
import limitedLotteryRoutes from './routes/limitedLotteryRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: [process.env.CLIENT_URL || '', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/lottery', lotteryRoutes);
app.use('/api/v1/limited-lottery', limitedLotteryRoutes);

app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
});