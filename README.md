# Lightweight API Rate Limiter

A **robust, framework-agnostic, and highly customizable rate limiter** for Node.js applications. Built by Ankit, a Software Development Engineer with expertise in React.js, Node.js, and AWS, this package is designed to protect your APIs from abuse while offering advanced features like token bucket rate limiting, pluggable storage, and real-time metrics. Whether you're using Express, Koa, Fastify, or a custom Node.js server, this package integrates seamlessly into any project.

## Why Choose This?
- **Universal Compatibility**: Works with Express, Koa, Fastify, or plain Node.js HTTP servers.
- **Advanced Rate Limiting**: Supports burst mode, dynamic limits, and token bucket algorithms.
- **Scalable Storage**: In-memory by default, with Redis or custom store options for distributed systems.
- **Developer-Friendly**: TypeScript support, detailed metrics, and comprehensive error handling.
- **Production-Ready**: Built with CI/CD, AWS deployment, and Agile practices in mind.

Crafted with ❤️ by [Ankit](https://imankit.hashnode.dev/), a passionate developer from Faridabad, Haryana, currently shaping the tech landscape in Bengaluru, India.

---

## Installation

```bash
npm install lightweight-api-rate-limiter
```

For Redis support (optional):
```bash
npm install redis
```

---

## Features

- **Framework-Agnostic**: Seamlessly integrates with any Node.js server framework.
- **Pluggable Storage**: Use in-memory, Redis, or custom stores (e.g., MongoDB).
- **Token Bucket Mode**: Smooth rate limiting with configurable token refill rates.
- **Dynamic Limits**: Adjust limits based on request context (e.g., user roles).
- **Burst Support**: Handle traffic spikes with temporary extra allowances.
- **Metrics**: Monitor usage with built-in request and block tracking.
- **Security**: Whitelist/blacklist, robust error handling, and graceful degradation.
- **TypeScript**: Full type definitions for a modern development experience.

---

## Usage

### Express Example
```javascript
const express = require('express');
const rateLimiter = require('lightweight-api-rate-limiter');

const app = express();
app.use(rateLimiter({
  max: 100,          // 100 requests
  windowMs: 60000,   // per minute
}));
app.get('/', (req, res) => res.send('Hello, World!'));
app.listen(3000, () => console.log('Server running'));
```

### Koa Example
```javascript
const Koa = require('koa');
const rateLimiter = require('lightweight-api-rate-limiter');

const app = new Koa();
app.use(rateLimiter({ max: 50, windowMs: 30000 }));
app.use(ctx => ctx.body = 'Hello from Koa!');
app.listen(3000);
```

### Fastify Example
```javascript
const fastify = require('fastify')();
const rateLimiter = require('lightweight-api-rate-limiter');

fastify.use(rateLimiter({ max: 200, windowMs: 900000 }));
fastify.get('/', (req, reply) => reply.send('Hello from Fastify!'));
fastify.listen({ port: 3000 });
```

### Token Bucket Mode
Smoothly limit to 50 requests per minute:
```javascript
app.use(rateLimiter({
  useTokenBucket: true,
  tokensPerInterval: 50,
  intervalMs: 60000,
}));
```

### Dynamic Limits
Higher limits for authenticated users:
```javascript
app.use(rateLimiter({
  max: 50,
  dynamicLimit: (req) => req.user?.isAuthenticated ? 200 : 50,
}));
```

### Metrics
Track usage stats:
```javascript
const limiter = rateLimiter({ max: 100, metrics: true });
app.use(limiter);
setInterval(() => console.log(limiter.getMetrics()), 5000);
```

---

## Configuration Options

| Option             | Type       | Default            | Description                                                                 |
|--------------------|------------|--------------------|-----------------------------------------------------------------------------|
| `max`              | `number`   | `100`              | Max requests per window (non-token mode).                                  |
| `windowMs`         | `number`   | `60000`            | Time window in milliseconds.                                               |
| `keyGenerator`     | `function` | `(req) => req.ip`  | Function to extract the rate limit key (e.g., IP, user ID).                |
| `store`            | `object`   | `MemoryStore`      | Custom storage object with `increment` and `consumeToken` methods.         |
| `redis`            | `object`   | `null`             | Redis client instance (overrides `store` if provided).                     |
| `logEvents`        | `boolean`  | `false`            | Enable console logging of rate limit events.                               |
| `logFile`          | `string`   | `null`             | Path to log file for persistent logging.                                   |
| `onLimit`          | `function` | `null`             | Callback when limit is exceeded (receives `req`, `res`, `next`).           |
| `whitelist`        | `array`    | `[]`               | Keys exempt from rate limiting.                                            |
| `blacklist`        | `array`    | `[]`               | Keys always blocked.                                                       |
| `burstMax`         | `number`   | `0`                | Extra requests allowed in burst mode.                                      |
| `burstWindowMs`    | `number`   | `windowMs`         | Burst window duration in milliseconds.                                     |
| `dynamicLimit`     | `function` | `null`             | Function to dynamically set `max` based on request context.                |
| `addHeaders`       | `boolean`  | `true`             | Add `X-RateLimit-*` headers to responses.                                  |
| `useTokenBucket`   | `boolean`  | `false`            | Enable token bucket algorithm instead of fixed window.                     |
| `tokensPerInterval`| `number`   | `max`              | Tokens refilled per interval (token bucket mode).                          |
| `intervalMs`       | `number`   | `windowMs`         | Token refill interval (token bucket mode).                                 |
| `metrics`          | `boolean`  | `false`            | Enable metrics tracking (accessible via `getMetrics()`).                   |

---

## Advanced Examples

### AWS Deployment with Redis
```javascript
const redis = require('redis');
const client = redis.createClient({ url: 'redis://your-redis-endpoint:6379' });
client.connect();

app.use(rateLimiter({
  max: 500,
  windowMs: 3600000, // 1 hour
  redis: client,
  logEvents: true,
  logFile: 'rate-limiter.log',
}));
```

### Multiple Limiters
Apply different rules to different routes:
```javascript
app.use('/public', rateLimiter({ max: 50, windowMs: 60000 }));
app.use('/api', rateLimiter({ max: 200, windowMs: 900000, burstMax: 50 }));
```

---

## About the Author
Hi, I'm **Ankit**, a Software Development Engineer-I at Mpal Solution Pvt. Ltd. in Bengaluru, India. With a B.Tech in Cyber Security from Lingaya's Vidyapeeth and hands-on experience in full-stack development, I specialize in building scalable, secure, and user-focused solutions. My journey includes leading Agile teams, deploying production systems on AWS, and mentoring interns—all while contributing to open-source projects like this one.

- **Blog**: [imankit.hashnode.dev](https://imankit.hashnode.dev/)
- **GitHub**: [github.com/imankii01](https://github.com/imankii01) 
- **NPM**: [npmjs.com/~private.ankit047](https://www.npmjs.com/~private.ankit047)

### Support My Work
If this package helps you, consider buying me a coffee! Your support fuels my passion for creating tools that empower developers.

<a href="https://www.buymeacoffee.com/imankii01" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

## Other Projects by Ankit
- **[Form-Genius](https://www.npmjs.com/package/form-genius)**: AI-powered form validation for Node.js.
- **[Committo](https://www.npmjs.com/package/committo)**: AI-driven commit message generator.
- **[Slugify-Plus](https://www.npmjs.com/package/slugify-plus)**: Advanced slug generator for SEO and more.
- **[Dynamic API Wrapper](https://www.npmjs.com/package/dynamic-api-wrapper)**: Simplify API calls in Node.js.
- **[Quick CLI Notes](https://www.npmjs.com/package/private.ankit047)**: CLI tool for managing notes efficiently.

---

## Contributing
Found a bug or have a feature idea? Open an issue or submit a pull request on [GitHub](https://github.com/imankii01/lightweight-api-rate-limiter). I’d love to collaborate!

1. Fork the repo.
2. Create a branch (`git checkout -b feature/awesome-idea`).
3. Commit your changes (`git commit -m "Add awesome idea"`).
4. Push to the branch (`git push origin feature/awesome-idea`).
5. Open a pull request.

---

## Development Setup
1. Clone the repo: `git clone https://github.com/imankii01/lightweight-api-rate-limiter.git`
2. Install dependencies: `npm install`
3. Run tests: `npm test`

---

## License
[MIT License](LICENSE) - Free to use, modify, and distribute.
