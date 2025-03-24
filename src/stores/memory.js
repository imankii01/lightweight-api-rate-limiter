class MemoryStore {
    constructor() {
      this.store = new Map();
    }
  
    async increment(key, max, windowMs) {
      const now = Date.now();
      let data = this.store.get(key);
      
      if (!data || now >= data.resetTime) {
        data = { count: 0, resetTime: now + windowMs };
      }
      
      data.count++;
      this.store.set(key, data);
      return { count: data.count, resetTime: data.resetTime };
    }
  
    async consumeToken(key, tokensPerInterval, intervalMs) {
      const now = Date.now();
      const data = this.store.get(key) || { tokens: tokensPerInterval, lastRefill: now };
      if (now > data.lastRefill + intervalMs) {
        data.tokens = tokensPerInterval;
        data.lastRefill = now;
      }
      if (data.tokens >= 1) data.tokens--;
      this.store.set(key, data);
      return { tokens: data.tokens, resetTime: data.lastRefill + intervalMs };
    }
  }
  
  module.exports = MemoryStore;