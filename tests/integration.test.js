const express = require('express');
const request = require('supertest');
const rateLimiter = require('../src/index');

describe('Rate Limiter Integration Tests', () => {
  let app;

  // Helper function to create a new Express app with the rate limiter
  const createApp = (options) => {
    const app = express();
    app.use(rateLimiter(options));
    app.get('/', (req, res) => res.send('OK'));
    return app;
  };

  beforeEach(() => {
    jest.useFakeTimers(); // Use fake timers to control time
  });

  afterEach(() => {
    jest.useRealTimers(); // Reset to real timers after each test
  });

  test('allows requests under the limit', async () => {
    app = createApp({ max: 2, windowMs: 1000 });

    const res1 = await request(app).get('/');
    expect(res1.status).toBe(200);
    expect(res1.text).toBe('OK');

    const res2 = await request(app).get('/');
    expect(res2.status).toBe(200);
    expect(res2.text).toBe('OK');
  });

  test('blocks requests over the limit', async () => {
    app = createApp({ max: 2, windowMs: 1000 });

    await request(app).get('/'); // 1st request
    await request(app).get('/'); // 2nd request
    const res = await request(app).get('/'); // 3rd request

    expect(res.status).toBe(429);
    expect(res.text).toBe('Too Many Requests');
    expect(res.headers['x-ratelimit-limit']).toBe('2');
    expect(res.headers['x-ratelimit-remaining']).toBe('0');
  });

  test('resets limit after window expires', async () => {
    app = createApp({ max: 1, windowMs: 1000 });

    await request(app).get('/'); // 1st request (OK)
    let res = await request(app).get('/'); // 2nd request (blocked)
    expect(res.status).toBe(429);

    jest.advanceTimersByTime(1000); // Move time forward by 1 second

    res = await request(app).get('/'); // Should work again
    expect(res.status).toBe(200);
  });

  test('allows burst requests', async () => {
    app = createApp({ max: 1, burstMax: 1, windowMs: 1000, burstWindowMs: 500 });

    const res1 = await request(app).get('/'); // Base limit
    expect(res1.status).toBe(200);

    const res2 = await request(app).get('/'); // Burst limit
    expect(res2.status).toBe(200);

    const res3 = await request(app).get('/'); // Over limit
    expect(res3.status).toBe(429);
    expect(res3.headers['x-ratelimit-limit']).toBe('2'); // max + burstMax
  });

  test('respects whitelist', async () => {
    app = createApp({ max: 1, windowMs: 1000, whitelist: ['127.0.0.1'] });

    const res1 = await request(app).get('/'); // 1st request
    const res2 = await request(app).get('/'); // 2nd request (normally blocked)
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200); // Whitelisted, so not blocked
  });

  test('blocks blacklist', async () => {
    app = createApp({ max: 10, windowMs: 1000, blacklist: ['127.0.0.1'] });

    const res = await request(app).get('/');
    expect(res.status).toBe(403);
    expect(res.text).toBe('Forbidden');
  });
});