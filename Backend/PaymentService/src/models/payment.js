import mongoose from 'mongoose'
import {v4 as uuidv4} from 'uuid'


const paymentSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        default :() => `pay_${uuidv4().replace(/-/g, '').substring(0, 20)}`,
    },
    orderId: {
        type: String,
        required: true
    },
    orderNumber: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true
    },
    status: {
        type: String,
        enum:['pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled'],
        default: 'pending'
    },
    method: {
        type: String,
        enum:['card', 'paypal', 'bank_transfer', 'simulated'],
        default: 'simulated'
    },
    // Simulated card info (never store real card data!)
    cardLast4: { type: String, default: null },
    cardBrand: { type: String, default: null },

    // Simulated gateway response
    gatewayTransactionId: { type: String, default: null },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: null },

    failureReason: { type: String, default: null },
    processedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    refundAmount: { type: Number, default: null },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
},
{ timestamps: true }
)


paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ id: 1 });
paymentSchema.index({ status: 1 });

export default mongoose.model('Payment', paymentSchema);