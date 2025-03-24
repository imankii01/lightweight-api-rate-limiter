class RedisStore {
    constructor(client) {
      this.client = client;
    }
  
    async increment(key, max, windowMs) {
      const now = Date.now();
      const count = parseInt(await this.client.get(key) || 0);
      const resetTime = parseInt(await this.client.get(`${key}:reset`) || now + windowMs);
      if (now > resetTime) {
        await this.client.set(key, 1, 'PX', windowMs);
        await this.client.set(`${key}:reset`, now + windowMs, 'PX', windowMs);
        return { count: 1, resetTime: now + windowMs };
      }
      await this.client.incr(key);
      return { count: count + 1, resetTime };
    }
  
    async consumeToken(key, tokensPerInterval, intervalMs) {
      const now = Date.now();
      const tokens = parseInt(await this.client.get(key) || tokensPerInterval);
      const lastRefill = parseInt(await this.client.get(`${key}:lastRefill`) || now);
      if (now > lastRefill + intervalMs) {
        await this.client.set(key, tokensPerInterval, 'PX', intervalMs);
        await this.client.set(`${key}:lastRefill`, now, 'PX', intervalMs);
        return { tokens: tokensPerInterval - 1, resetTime: now + intervalMs };
      }
      if (tokens >= 1) await this.client.decr(key);
      return { tokens: tokens - 1, resetTime: lastRefill + intervalMs };
    }
  }
  
  module.exports = RedisStore;