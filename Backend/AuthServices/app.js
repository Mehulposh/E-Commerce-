import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from 'cors';
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/authRoutes.js";
import errorHandler from "./src/middlewares/errorHandler.js";

dotenv.config();
const PORT = process.env.PORT
const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Error handler
app.use(errorHandler);

//Routes
app.use("/api/auth", authRoutes);


// DB + Start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () =>
      console.log(`🔐 Auth Service running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
