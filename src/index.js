const fs = require('fs').promises;
const MemoryStore = require('./stores/memory');
const RedisStore = require('./stores/redis');
const { RateLimitError, ConfigurationError } = require('./errors');
const Metrics = require('./metrics');

/**
 * Creates a rate limiter middleware for Node.js applications.
 * @param {Object} options - Configuration options
 * @returns {Function} - Middleware function
 */
const rateLimiter = (options = {}) => {
  const {
    max = 100,
    windowMs = 60000,
    keyGenerator = (req) => req.ip || req.ctx?.ip,
    store = new MemoryStore(),
    redis = null,
    logEvents = false,
    logFile = null,
    onLimit = null,
    whitelist = [],
    blacklist = [],
    burstMax = 0,
    burstWindowMs = windowMs,
    dynamicLimit = null,
    addHeaders = true,
    useTokenBucket = false,
    tokensPerInterval = max,
    intervalMs = windowMs,
    metrics = false,
  } = options;

  const effectiveStore = redis ? new RedisStore(redis) : store;
  const metricsTracker = metrics ? new Metrics() : null;
  const log = async (message) => {
    if (logEvents) console.log(`[Rate Limiter] ${message}`);
    if (logFile) await fs.appendFile(logFile, `${new Date().toISOString()} - ${message}\n`);
  };

  if (useTokenBucket && tokensPerInterval <= 0) {
    throw new ConfigurationError('tokensPerInterval must be positive when using token bucket');
  }

  const middleware = async (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (whitelist.includes(key)) return next();
    if (blacklist.includes(key)) {
      await log(`Blocked blacklisted key: ${key}`);
      return onLimit ? onLimit(req, res, next) : sendError(res, 403, 'Forbidden');
    }

    const effectiveMax = dynamicLimit ? dynamicLimit(req) : max;
    if (effectiveMax < 0) throw new ConfigurationError('Dynamic limit must be non-negative');

    try {
      if (useTokenBucket) {
        const { tokens, resetTime } = await effectiveStore.consumeToken(key, tokensPerInterval, intervalMs);
        if (tokens < 1) {
          await log(`Key ${key} out of tokens`);
          if (addHeaders) setHeaders(res, tokensPerInterval, 0, resetTime);
          return onLimit ? onLimit(req, res, next) : sendError(res, 429, 'Too Many Requests');
        }
        if (addHeaders) setHeaders(res, tokensPerInterval, tokens - 1, resetTime);
      } else {
        const { count, resetTime } = await effectiveStore.increment(key, effectiveMax, windowMs);
        const burstData = burstMax > 0 ? await effectiveStore.increment(`${key}:burst`, burstMax, burstWindowMs) : null;
        const totalMax = effectiveMax + (burstData ? burstMax : 0);
        const totalCount = count + (burstData ? burstData.count : 0);

        if (totalCount > totalMax) {
          await log(`Key ${key} hit limit: ${totalCount}/${totalMax}`);
          if (addHeaders) setHeaders(res, totalMax, 0, resetTime);
          return onLimit ? onLimit(req, res, next) : sendError(res, 429, 'Too Many Requests');
        }
        if (addHeaders) setHeaders(res, totalMax, totalMax - totalCount, resetTime);
      }

      if (metricsTracker) metricsTracker.recordRequest(key);
      next();
    } catch (err) {
      await log(`Error: ${err.message}`);
      if (redis && effectiveStore instanceof RedisStore) {
        await log('Falling back to in-memory store');
        const fallbackStore = new MemoryStore();
        await fallbackStore.increment(key, effectiveMax, windowMs);
        next();
      } else {
        throw new RateLimitError(err.message);
      }
    }
  };

  // Framework-agnostic response handling
  const sendError = (res, status, message) => {
    if (res.ctx) { // Koa
      res.ctx.status = status;
      res.ctx.body = message;
    } else if (res.setHeader) { // Fastify
      res.status(status).send(message);
    } else { // Express or plain Node.js
      res.status(status).send(message);
    }
  };

  const setHeaders = (res, limit, remaining, reset) => {
    const headers = {
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': remaining,
      'X-RateLimit-Reset': Math.ceil(reset / 1000),
    };
    if (res.ctx) { // Koa
      Object.entries(headers).forEach(([key, value]) => res.ctx.set(key, value));
    } else if (res.setHeader) { // Fastify
      Object.entries(headers).forEach(([key, value]) => res.header(key, value));
    } else { // Express or plain Node.js
      res.set(headers);
    }
  };

  middleware.getMetrics = () => metricsTracker ? metricsTracker.getStats() : null;
  return middleware;
};

module.exports = rateLimiter;