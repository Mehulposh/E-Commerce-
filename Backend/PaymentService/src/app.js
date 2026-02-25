import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import mongoose from 'mongoose'
import paymentRoutes from './routes/paymentRoutes.js'
import errorHandler from './middlewares/errorHandler.js'

dotenv.config()

const app = express()

//middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());


//routes
app.use('/api/payments', paymentRoutes)

//service health check
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'payment-service' })
);

//service error handler middleware
app.use(errorHandler);

//mongodb connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT, () =>
      console.log(`💳 Payment Service running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
