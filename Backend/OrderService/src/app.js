import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import orderRoutes from './routes/orderRoutes.js';
import internalRoutes from './routes/internalRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/orders', orderRoutes);
app.use('/api/orders/internal', internalRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'order-service' }));

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT, () =>
      console.log(`🛒 Order Service running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });