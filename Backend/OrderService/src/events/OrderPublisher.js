import { publishEvent , EXCHANGES , ROUTING_KEYS } from "./Rabbitmq.js";

/**
 * Published when a new order is created
 * Payment Service listens to this and initiates payment
 */
const publishOrderCreated = async(order, userEmail=null) => {
    await publishEvent(EXCHANGES.ORDERS , ROUTING_KEYS.ORDER_CREATED , {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: order.userId,
        items: order.items,
        totalAmount: order.totalAmount,
        currency: 'USD',
        userEmail,
        shippingAddress: order.shippingAddress,
    });
};


/**
 * Published when an order is cancelled
 * Payment Service listens and triggers refund if payment exists
 */

const publishOrderCancelled = async(order) => {
    await publishEvent(EXCHANGES.ORDERS, ROUTING_KEYS.ORDER_CANCELLED , {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: order.userId,
        paymentId: order.paymentId,
        reason: 'Order cancelled by the user'
    });
};


/**
 * Published when order status changes
 */
const publishOrderStatusUpdate = async(order,previousStatus) => {
    await publishEvent(EXCHANGES.ORDERS, ROUTING_KEYS.ORDER_STATUS_UPDATED , {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: order.userId,
        previousStatus,
        newStatus: order.status
    })
}


export {
    publishOrderCreated,
    publishOrderCancelled,
    publishOrderStatusUpdate
}