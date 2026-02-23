import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from "dotenv";
import productRoutes from './routes/productRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { connectRedis } from './utils/redis.js';

dotenv.config()


const app = express();


// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);

//Health Check
app.get('/health',(req,res) => {
  res.status(200).json({status:'OK'});
})

// Error handler
app.use(errorHandler);

// Bootstrap
async function bootstrap() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    await connectRedis();

    app.listen(process.env.PORT, () =>
      console.log(`📦 Product Service running on port ${process.env.PORT}`)
    );
  } catch (err) {
    console.error('❌ Bootstrap error:', err.message);
    process.exit(1);
  }
}

bootstrap();