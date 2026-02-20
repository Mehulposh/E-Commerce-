import Redis from 'ioredis';

let redisClient;

const connectRedis = async () => {
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redisClient.on('connect', () => console.log('✅ Redis connected'));
  redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));

  await redisClient.connect();
  return redisClient;
};

const getRedis = () => {
  if (!redisClient) throw new Error('Redis not initialized');
  return redisClient;
};

export { connectRedis, getRedis };