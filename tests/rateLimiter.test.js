const rateLimiter = require('../src/index');
const MemoryStore = require('../src/stores/memory');

describe('Rate Limiter', () => {
  let req, res, next;

  beforeEach(() => {
    req = { ip: '192.168.1.1' };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      set: jest.fn(),
    };
    next = jest.fn();
  });

  test('allows requests under limit', async () => {
    const limiter = rateLimiter({ max: 2, windowMs: 1000 });
    await limiter(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('blocks requests over limit', async () => {
    const limiter = rateLimiter({ max: 1, windowMs: 1000 });
    await limiter(req, res, next);
    await limiter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  test('token bucket mode', async () => {
    const limiter = rateLimiter({ useTokenBucket: true, tokensPerInterval: 1, intervalMs: 1000 });
    await limiter(req, res, next);
    await limiter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  test('metrics tracking', async () => {
    const limiter = rateLimiter({ max: 2, metrics: true });
    await limiter(req, res, next);
    const stats = limiter.getMetrics();
    expect(stats['192.168.1.1'].requests).toBe(1);
  });
});