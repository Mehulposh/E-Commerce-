import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from "dotenv";
import productRoutes from './routes/product.routes';
import { errorHandler } from './middleware/error.middleware';
import { connectRedis } from './config/redis';

dotenv.config()


const app = express();


// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'product-service' }));

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