class Metrics {
    constructor() {
      this.stats = new Map();
    }
  
    recordRequest(key) {
      const data = this.stats.get(key) || { requests: 0, blocks: 0 };
      data.requests++;
      this.stats.set(key, data);
    }
  
    recordBlock(key) {
      const data = this.stats.get(key) || { requests: 0, blocks: 0 };
      data.blocks++;
      this.stats.set(key, data);
    }
  
    getStats() {
      return Object.fromEntries(this.stats);
    }
  }
  
  module.exports = Metrics;