// Rate limiting utility for API calls and user actions
type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  check(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (entry.count >= config.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;
    return Math.max(0, entry.resetTime - Date.now());
  }

  reset(key: string): void {
    this.limits.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Cleanup old entries every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

// Common rate limit configurations
export const RATE_LIMITS = {
  AI_GENERATION: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
  EMAIL_SEND: { maxRequests: 5, windowMs: 60000 }, // 5 emails per minute
  PDF_GENERATION: { maxRequests: 20, windowMs: 60000 }, // 20 PDFs per minute
  API_CALL: { maxRequests: 100, windowMs: 60000 }, // 100 API calls per minute
  LOGIN_ATTEMPT: { maxRequests: 5, windowMs: 300000 }, // 5 attempts per 5 minutes
};
