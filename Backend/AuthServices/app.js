import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from 'cors';
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/authRoutes.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import sendOTPEmail from "./src/utils/emailUtils.js";
dotenv.config();
const PORT = process.env.PORT
const app = express();

// Middleware
app.set('trust proxy', 1);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());


//Routes
app.use("/api/auth", authRoutes);

//Health Check
app.get('/health',(req,res) => {
  res.status(200).json({status:'OK'});
})

// Error handler
app.use(errorHandler);

// DB + Start
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () =>
      console.log(`🔐 Auth Service running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
