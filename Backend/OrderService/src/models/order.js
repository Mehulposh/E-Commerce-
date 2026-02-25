import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    userId: { type: String, required: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },

    paymentId: { type: String, default: null },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },

    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true, default: 'US' },
    },

    notes: { type: String, default: '' },

    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate order number before save
orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Index for user order lookups
orderSchema.index({ userId: 1, createdAt: -1 });
// orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });

export default mongoose.model('Order', orderSchema);