declare module 'lightweight-api-rate-limiter' {
    interface RateLimiterOptions {
      max?: number;
      windowMs?: number;
      keyGenerator?: (req: any) => string;
      store?: { increment: Function; consumeToken: Function };
      redis?: any;
      logEvents?: boolean;
      logFile?: string | null;
      onLimit?: (req: any, res: any, next: Function) => void;
      whitelist?: string[];
      blacklist?: string[];
      burstMax?: number;
      burstWindowMs?: number;
      dynamicLimit?: (req: any) => number;
      addHeaders?: boolean;
      useTokenBucket?: boolean;
      tokensPerInterval?: number;
      intervalMs?: number;
      metrics?: boolean;
    }
  
    interface RateLimiterMiddleware {
      (req: any, res: any, next: Function): Promise<void>;
      getMetrics: () => { [key: string]: { requests: number; blocks: number } } | null;
    }
  
    function rateLimiter(options?: RateLimiterOptions): RateLimiterMiddleware;
    export = rateLimiter;
  }