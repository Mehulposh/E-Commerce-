import Payment from '../models/payment.js'
import { processPayment, processRefund } from '../utills/PaymentSimulationEngine.js'
import { notifyOrderPaymentUpdate } from '../service/serviceClient.js'

// POST /api/payments/initiate  (called by Order Service internally)
const initiatePayment = async(req,res,next) => {
    try {
        const {orderId , orderNumber , userID, amount , currency , cardNumber , method} = req.body

        if(!orderId || !userID || !amount){
           return res.status(400).json({message: 'orderId, userId, and amount are required' });
        }

        // Prevent duplicate payments for same order
        const existing = await Payment.findOne( {orderId, status: { $in: ['pending', 'processing', 'succeeded'] } })

        if(existing){
            return res.status(409).json({
                message: 'A payment already exists for this order', 
                payment: existing
            })
        }

        // Create payment record in pending state
        const newPayment = Payment.create({
            orderId,
            orderNumber,
            userID,
            amount,
            method: "simulated",
            currency: currency || 'USD',
            status: "processing"
        })

        // ── Run the simulation ────────────────────────
        const result  = await processPayment({amount,currency,cardNumber,method})

        newPayment.status= result.status ? "success" : "failed";
        newPayment.gatewayTransactionId = result.transactionId;
        newPayment.cardLast4 = result.cardLast4;
        newPayment.cardBrand = result.cardBrand;
        newPayment.failureReason = result.failureReason;
        newPayment.processedAt = new Date();
        newPayment.gatewayResponse = result.gatewayResponse;

        await newPayment.save()

        // ── Notify Order Service ────────────────────────────────
        await notifyOrderPaymentUpdate(
            orderId,
            result.success? "success" : "failed",
            newPayment.id
        )

        const statusCode = result.success ? 201 : 402;

        res.status(statusCode).json({
            message: result.success ? 'Payment successful' : 'Payment failed',
            payment,
        });
    } catch (error) {
        next(error)
    }
}


// GET /api/payments/:id
const getPayment = async (req,res,next) => {
    try {
        const id = req.params.id
        const payment = await Payment.findOne({
            $or: [
                {id: id},
                {_id: id.match(/^[a-f\d]{24}$/i)} ? id : null
            ]
        })

        if(!payment){
            return res.status(400).json({
                message: 'Payment not found'
            })
        }

        // Users can only see their own payments
        if(req.user.role !== 'admin' && payment.userId !== id.toSting() ){
            return res.status(403).json({
                message: 'Access Denied'
            })
        }

        res.json({payment})
    } catch (error) {
        next(error)
    }
}


// GET /api/payments  (admin: all; user: own)
const getAllPayments = async(req,res,next) => {
    try {
        const {page = 1, limit= 10 , status} = req.query
        const query = {}

        if(req.user.role !== 'admin' ){
            query.userID = req.user._id.toSting();
        }

        if (status) query.status = status;

        const skip = (Number(page) - 1) * Number(limit);

        const [payments, total] = await Promise.all([
            Payment.find(query).skip(skip).limit(Number(limit)).sort({createdAt: -1}),
            Payment.countDocuments(query)
        ]) 

        res.json({
            payments,
            pagination: {
                total , 
                page: Number(page) , 
                limit: Number(limit) ,
                pages: Math.ceil(total/Number(limit))
            }
        })
    } catch (error) {
        next(error)
    }
}


// GET /api/payments/order/:orderId
const getPaymentByOrder = async(req,res,next) => {
    try {
        const id = req.params.orderId

        const payment = await Payment.findOne({orderId : id}).sort({createdAt: -1});

        if(!payment){
            return res.status(400).json({message: 'No payment found for this order'})
        }

        if(req.user.role !== 'admin' && payment.userId !== req.user._id.toSting()){
            return res.status(403).json({message: 'Access Denied'})
        }

        res.json({payment})
    } catch (error) {
        next(error)
    }
}


// POST /api/payments/:id/refund  (admin only)
const refundPayment = async(req,res,next) => {
    try {
        const id = req.params.id
        const payment = await Payment.findOne({id: id})

        if(!payment){
            return res.status(400).json({message: 'No payment found for this order'})
        }

        const refundAmount = req.body.amount || payment.amount;

        if (refundAmount > payment.amount) {
            return res.status(400).json({ message: 'Refund amount cannot exceed original payment' });
        }


        const result = await processRefund({
            transactionId: payment.gatewayTransactionId,
            amount: refundAmount
        })

        if (!result.success) {
            return res.status(502).json({ message: 'Refund processing failed', reason: result.failureReason });
        }


        payment.status = 'refunded';
        payment.refundedAt = new Date();
        payment.refundAmount = refundAmount;

        await payment.save()

        // Notify order service
        await notifyOrderPaymentUpdate(payment.orderId, 'refunded', payment.id);

        res.json({message: 'Refund successfull', payment})
    } catch (error) {
        next(error)
    }
}

export {
    initiatePayment,
    getPayment,
    getAllPayments,
    getPaymentByOrder,
    refundPayment
}