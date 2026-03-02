import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: ['email', 'in_app'],
      required: true,
    },
    event: {
      type: String,
      enum: [
        'payment.succeeded',
        'payment.failed',
        'payment.refunded',
        'order.confirmed',
        'order.cancelled',
        'order.shipped',
        'order.delivered',
      ],
      required: true,
    },
    recipient: { type: String, required: true }, // email address or userId
    subject: { type: String, default: null },    // email subject
    body: { type: String, required: true },       // message content
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    error: { type: String, default: null },
    sentAt: { type: Date, default: null },
    readAt: { type: Date, default: null },

    // Reference data
    orderId: { type: String, default: null },
    orderNumber: { type: String, default: null },
    paymentId: { type: String, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ event: 1 });

export default mongoose.model('Notification', notificationSchema);