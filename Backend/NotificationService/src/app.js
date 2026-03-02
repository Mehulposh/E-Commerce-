import dotenv from 'dotenv'
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import notificationRoutes from './routes/Notificationroutes.js';
import { connectRabbitMQ } from './events/Rabbitmq.js';
import  registerNotificationConsumers  from './events/notificationConsumer.js';
import {initEmailTransporter,createTestAccount}  from './services/emailService.js';

dotenv.config()
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'notification-service' })
);

app.use((err, req, res, next) => {
  console.error(`[Notification Service Error] ${err.message}`);
  res.status(err.statusCode || 500).json({ message: err.message || 'Internal server error' });
});

async function bootstrap() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Initialize email transporter
    if (process.env.NODE_ENV === 'production') {
      initEmailTransporter();          // ← real SMTP
    } else {
      await createTestAccount();       // ← Ethereal for dev
    }

    await connectRabbitMQ();
    await registerNotificationConsumers();

    app.listen(process.env.PORT || 3005, () =>
      console.log(`🔔 Notification Service running on port ${process.env.PORT || 3005}`)
    );
  } catch (err) {
    console.error('❌ Bootstrap error:', err.message);
    process.exit(1);
  }
}

bootstrap();