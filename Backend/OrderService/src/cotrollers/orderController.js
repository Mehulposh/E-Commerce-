import  Order from '../models/order.js'
import { getProduct,InitiatePayment,getPaymentStatus } from '../service/Service-client.js'

//POST api/orders
const createOrders = async(req,res,next) =>{
    try {
        const {items , shipingAddress , notes} = req.body

        const user_id = req.user_id.toString()

        // ── 1. Validate & enrich each item from Product Service ──
        const enrichedItems = [];
        let totalAmount = 0;

        for(const item of items){
            let product
            try {
                product = await getProduct(item.productId)
            } catch (error) {
                return res.status(404).json({message: `Product not found: ${item.productId}`})
            }

            if(!product.isActive){
                return res.status(400).json({message: `Product "${product.name}" is no longer available`})
            }

            if(product.stock < item.quantity){
                return res.status(400).json({message: `Insufficient stock for "${product.name}". Available: ${product.stock}`})
            }

            const subtotal = product.price * item.quantity

            totalAmount += subtotal

            enrichedItems.push({
                productId: product._id.toString(),
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                subtotal,
            });
        }

        // ── 2. Create the order ───────────────────────────────────
        const order = await Order.create({
            user_id,
            items: enrichedItems,
            totalAmount,
            shippingAddress,
            notes,
            statusHistory: [{ status: 'pending', note: 'Order created' }],
        });

        // ── 3. Initiate payment ───────────────────────────────────
        let paymentData

        try {
            paymentData = await InitiatePayment({
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                user_id,
                amount: totalAmount,
                currency: 'USD',
            })

            order.paymentId = paymentData.payment.id

            await order.save()

        } catch (error) {
            console.error('[Order] Payment initiation failed:', err.message);
        }

        res.status(201).json({
            message: 'Order created successfully',
            order,
            payment: paymentData?.payment || null,
        });
    } catch (error) {
        next(error)
    }
}


// GET /api/orders  (user sees their own; admin sees all)
const getOrder = async(req,res,next) => {
    try {
        const {page = 1 , limit = 10 , status} = req.query

        const query = {}

        if (req.user.role !== 'admin') {
            query.userId = req.user._id.toString();
        }
        if (status) query.status = status;

        const skip = (Number(page) - 1) * Number(limit)

        const [orders , total ] = await Promise.all([
            Order.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
            Order.countDocuments(query),
        ])

         res.json({
            orders,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
        });
    } catch (error) {
        next(error)
    }

}


// GET /api/orders/:id
const getOrderByID = async(req,res,next)=> {
    try {
        const order = await Order.findById(req.params.id)

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Users can only see their own orders
        if (req.user.role !== 'admin' && order.userId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Optionally fetch live payment status
        let paymentInfo = null;
        if (order.paymentId) {
            try {
                paymentInfo = await getPaymentStatus(order.paymentId);
            } catch {
                // Non-critical — return order without payment details
            }
        }

        res.json({ order, payment: paymentInfo });
    } catch (error) {
        next(error)
    }
}


// PATCH /api/orders/:id/status  (admin only)
const updateOrderStatus = async(req,res,next) => {
    try {
        const {status , notes} = req.body
        const order = await Order.findById(req.params.id)

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const previousStatus = order.status;
        order.status = status;
        order.statusHistory.push({ status, note: notes || `Status changed from ${previousStatus}` });
        await order.save();

        res.json({ message: 'Order status updated', order });
    } catch (error) {
        next(error)
    }
}


// POST /api/orders/:id/cancel
const CancelOrder = async(req,res,next) => {
    try {
        const order = await Order.findById(req,params.id)

        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (req.user.role !== 'admin' && order.userId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const cancellableStatuses = ['pending', 'confirmed'];

        if (!cancellableStatuses.includes(order.status)) {
            return res.status(400).json({
                message: `Cannot cancel order with status "${order.status}"`,
        });

        order.status = 'cancelled'

        order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by user' })

        await order.save()

        res.json({message: 'Order Cancelled', order})
    }
    } catch (error) {
        next(error)
    }
}


// POST /api/orders/:id/pay  (manually trigger payment for pending order)
const payOrder = async(req,res,next) => {
    try {
        const order = await Order.findById(req,params.id)

        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (req.user.role !== 'admin' && order.userId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Order is already paid' });
        }

         const paymentData = await initiatePayment({
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            userId: order.userId,
            amount: order.totalAmount,
            currency: 'USD',
            ...req.body, // allow passing card/method info
        });

        order.paymentId = paymentData.payment.id;
        await order.save();

        res.json({message: 'Payment initiated', order, payment: paymentData.payment})
    } catch (error) {
        next(error)
    }
}


export {
    payOrder,
    CancelOrder,
    updateOrderStatus,
    getOrderByID,
    getOrder,
    createOrders
}