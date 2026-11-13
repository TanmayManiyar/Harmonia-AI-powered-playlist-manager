import rateLimit from 'express-rate-limit';
import { Redis } from '@upstash/redis';

// Serverless runs many instances, so in-memory counters would be per-instance.
// If Upstash Redis is configured (UPSTASH_REDIS_REST_URL/_TOKEN, or the
// KV_REST_API_* vars from Vercel's Upstash integration) share counters there;
// otherwise fall back to the default in-memory store (fine for a single server).
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

class UpstashStore {
  constructor(prefix) {
    this.prefix = `rl:${prefix}:`;
  }
  init(options) {
    this.windowMs = options.windowMs;
  }
  async increment(key) {
    const k = this.prefix + key;
    const totalHits = await redis.incr(k);
    if (totalHits === 1) await redis.pexpire(k, this.windowMs);
    const ttl = await redis.pttl(k);
    return { totalHits, resetTime: new Date(Date.now() + (ttl > 0 ? ttl : this.windowMs)) };
  }
  async decrement(key) {
    await redis.decr(this.prefix + key);
  }
  async resetKey(key) {
    await redis.del(this.prefix + key);
  }
}

const store = (name) => (redis ? { store: new UpstashStore(name), passOnStoreError: true } : {});

const json = (req, res) =>
  res.status(429).json({ error: 'Too many requests — slow down a bit and try again shortly.' });

// Auth: protect against credential stuffing / signup spam.
export const authLimiter = rateLimit({
  ...store('auth'),
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json,
});

// AI (Gemini) — expensive + quota-bound, keep it tight per IP.
export const aiLimiter = rateLimit({
  ...store('ai'),
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json,
});

// YouTube search/genre — quota-bound but cheaper than AI.
export const searchLimiter = rateLimit({
  ...store('search'),
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json,
});

// General API safety net.
export const apiLimiter = rateLimit({
  ...store('api'),
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json,
});
