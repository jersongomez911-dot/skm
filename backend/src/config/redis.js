const Redis = require('ioredis');
const logger = require('../utils/logger.utils');

let redis = null;
let isConnected = false;

function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('⚠️  Redis unavailable, running without cache');
          return null; // stop retrying
        }
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redis.on('connect', () => { isConnected = true; logger.info('✅ Redis connected'); });
    redis.on('error', () => { isConnected = false; });
    redis.on('close', () => { isConnected = false; });

    redis.connect().catch(() => {
      logger.warn('⚠️  Redis not available, token blacklist will use memory fallback');
    });
  }
  return redis;
}

// Memory fallback for token blacklist
const memoryBlacklist = new Set();

const tokenBlacklist = {
  async add(token, expiresInSeconds = 900) {
    try {
      const r = getRedis();
      if (isConnected) {
        await r.setex(`bl:${token}`, expiresInSeconds, '1');
        return;
      }
    } catch {}
    memoryBlacklist.add(token);
    setTimeout(() => memoryBlacklist.delete(token), expiresInSeconds * 1000);
  },
  async has(token) {
    try {
      const r = getRedis();
      if (isConnected) {
        const val = await r.get(`bl:${token}`);
        return val !== null;
      }
    } catch {}
    return memoryBlacklist.has(token);
  },
};

// Generic cache helpers
const cache = {
  async get(key) {
    try {
      const r = getRedis();
      if (!isConnected) return null;
      const val = await r.get(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },
  async set(key, value, ttlSeconds = 300) {
    try {
      const r = getRedis();
      if (!isConnected) return;
      await r.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {}
  },
  async del(key) {
    try {
      const r = getRedis();
      if (!isConnected) return;
      await r.del(key);
    } catch {}
  },
};

module.exports = { getRedis, tokenBlacklist, cache };
