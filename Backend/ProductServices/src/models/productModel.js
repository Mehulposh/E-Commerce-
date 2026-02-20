import  mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ['electronics', 'clothing', 'food', 'books', 'other'],
      lowercase: true,
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true }, // user ID from auth service
  },
  { timestamps: true }
);

// Index for search performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

export default mongoose.model('Product', productSchema);