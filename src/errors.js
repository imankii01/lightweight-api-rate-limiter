class RateLimitError extends Error {
    constructor(message) {
      super(message);
      this.name = 'RateLimitError';
    }
  }
  
  class ConfigurationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ConfigurationError';
    }
  }
  
  module.exports = { RateLimitError, ConfigurationError };