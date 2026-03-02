import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import orderRoutes from './routes/orderRoutes.js';
import internalRoutes from './routes/internalRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

import {connectRabbitMQ} from './events/Rabbitmq.js'
import {registerOrderConsumer} from './events/OrderConsumer.js'

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/orders', orderRoutes);
app.use('/api/orders/internal', internalRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'order-service' }));

app.use(errorHandler);

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    await connectRabbitMQ();
    await registerOrderConsumer();

    app.listen(process.env.PORT, () =>
      console.log(`🛒 Order Service running on port ${process.env.PORT}`)
    );
  } catch (err) {
    console.error('❌ Bootstrap error:', err.message);
    process.exit(1);
  }
}


startServer()