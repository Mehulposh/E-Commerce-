import { getRedis } from './redis.js';

const TTL = parseInt(process.env.CACHE_TTL) || 3600; // 1 hour default

/**
 * Get a value from Redis cache
 */
const getCache = async (key) => {
  try {
    const redis = getRedis();
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn('[Cache] GET error:', err.message);
    return null; // Graceful degradation
  }
};

/**
 * Set a value in Redis cache
 */
const setCache = async (key, value, ttl = TTL) => {
  try {
    const redis = getRedis();
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.warn('[Cache] SET error:', err.message);
  }
};

/**
 * Delete cache by key or pattern
 */
const deleteCache = async (key) => {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch (err) {
    console.warn('[Cache] DEL error:', err.message);
  }
};

/**
 * Invalidate all product-related cache keys
 */
const invalidateProductCache = async (productId = null) => {
  try {
    const redis = getRedis();
    const keys = await redis.keys('products:*');
    if (keys.length) await redis.del(...keys);
    if (productId) await redis.del(`product:${productId}`);
  } catch (err) {
    console.warn('[Cache] Invalidation error:', err.message);
  }
};

export { getCache, setCache, deleteCache, invalidateProductCache };