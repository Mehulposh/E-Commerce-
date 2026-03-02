import amqp from 'amqplib';

let connection = null;
let channel = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';

// Exchange definitions
const EXCHANGES = {
  ORDERS: 'orders.exchange',
  PAYMENTS: 'payments.exchange',
  PRODUCTS: 'products.exchange',
};

// Routing keys
const ROUTING_KEYS = {
  ORDER_CREATED: 'order.created',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_STATUS_UPDATED: 'order.status.updated',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
};

const connectRabbitMQ = async (retries = 10, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

      // Declare all exchanges as durable topic exchanges
      await channel.assertExchange(EXCHANGES.ORDERS, 'topic', { durable: true });
      await channel.assertExchange(EXCHANGES.PAYMENTS, 'topic', { durable: true });
      await channel.assertExchange(EXCHANGES.PRODUCTS, 'topic', { durable: true });

      connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error:', err.message);
        setTimeout(() => connectRabbitMQ(), delay);
      });

      connection.on('close', () => {
        console.warn('[RabbitMQ] Connection closed, reconnecting...');
        setTimeout(() => connectRabbitMQ(), delay);
      });

      console.log('✅ RabbitMQ connected');
      return channel;
    } catch (err) {
      console.warn(`[RabbitMQ] Connection attempt ${i + 1}/${retries} failed: ${err.message}`);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('[RabbitMQ] Could not connect after max retries');
};

const getChannel = () => {
  if (!channel) throw new Error('[RabbitMQ] Channel not initialized');
  return channel;
};

/**
 * Publish an event to an exchange
 */
const publishEvent = async (exchange, routingKey, payload) => {
  try {
    const ch = getChannel();
    const message = Buffer.from(JSON.stringify({
      ...payload,
      _meta: {
        routingKey,
        timestamp: new Date().toISOString(),
        service: 'order-service',
      },
    }));
    ch.publish(exchange, routingKey, message, { persistent: true });
    console.log(`[RabbitMQ] Published → ${exchange}::${routingKey}`);
  } catch (err) {
    console.error('[RabbitMQ] Publish error:', err.message);
  }
};

/**
 * Subscribe to events from an exchange with a routing key pattern
 */
const consumeEvents = async (exchange, routingKey, queueName, handler) => {
  try {
    const ch = getChannel();
    const q = await ch.assertQueue(queueName, { durable: true });
    await ch.bindQueue(q.queue, exchange, routingKey);
    ch.prefetch(1);

    ch.consume(q.queue, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        console.log(`[RabbitMQ] Received ← ${exchange}::${routingKey}`);
        await handler(payload);
        ch.ack(msg);
      } catch (err) {
        console.error('[RabbitMQ] Handler error:', err.message);
        ch.nack(msg, false, false); // Dead-letter — don't requeue
      }
    });

    console.log(`[RabbitMQ] Consuming ${queueName} ← ${exchange}::${routingKey}`);
  } catch (err) {
    console.error('[RabbitMQ] Consume error:', err.message);
  }
};

export {
  connectRabbitMQ,
  getChannel,
  publishEvent,
  consumeEvents,
  EXCHANGES,
  ROUTING_KEYS,
};