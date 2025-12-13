
/**
 * Client-side rate limiter for API calls
 * Prevents API quota abuse and implements exponential backoff
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  /**
   * Register a rate limit configuration for a specific key
   */
  register(key: string, config: RateLimitConfig): void {
    this.configs.set(key, config);
  }

  /**
   * Check if a request is allowed under the rate limit
   */
  isAllowed(key: string): { allowed: boolean; retryAfter?: number } {
    const config = this.configs.get(key);
    if (!config) {
      console.warn(`No rate limit config found for key: ${key}`);
      return { allowed: true };
    }

    const now = Date.now();
    const entry = this.limits.get(key);

    // Check if blocked due to previous rate limit violation
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
      };
    }

    // Initialize or reset if window expired
    if (!entry || entry.resetAt <= now) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + config.windowMs
      });
      return { allowed: true };
    }

    // Check if within limit
    if (entry.count < config.maxRequests) {
      entry.count++;
      return { allowed: true };
    }

    // Rate limit exceeded
    const retryAfter = config.retryAfterMs || config.windowMs;
    entry.blockedUntil = now + retryAfter;

    return {
      allowed: false,
      retryAfter: Math.ceil(retryAfter / 1000)
    };
  }

  /**
   * Track a request and enforce rate limiting
   */
  async trackRequest<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const { allowed, retryAfter } = this.isAllowed(key);

    if (!allowed) {
      throw new Error(
        `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
      );
    }

    return fn();
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  resetAll(): void {
    this.limits.clear();
  }

  /**
   * Get current rate limit status for a key
   */
  getStatus(key: string): {
    count: number;
    limit: number;
    resetAt: number;
    isBlocked: boolean;
  } | null {
    const config = this.configs.get(key);
    const entry = this.limits.get(key);

    if (!config) return null;

    const now = Date.now();
    const isBlocked = !!(entry?.blockedUntil && entry.blockedUntil > now);

    return {
      count: entry?.count || 0,
      limit: config.maxRequests,
      resetAt: entry?.resetAt || now + config.windowMs,
      isBlocked
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Pre-configure rate limits for AI services
rateLimiter.register('ai-assist', {
  maxRequests: 10, // 10 requests
  windowMs: 60000, // per minute
  retryAfterMs: 30000 // 30 second cooldown after limit
});

rateLimiter.register('ai-quote-generation', {
  maxRequests: 5, // 5 requests
  windowMs: 60000, // per minute
  retryAfterMs: 60000 // 1 minute cooldown
});

rateLimiter.register('ai-follow-up', {
  maxRequests: 10, // 10 requests
  windowMs: 60000, // per minute
  retryAfterMs: 30000 // 30 second cooldown
});

rateLimiter.register('ai-item-recommendations', {
  maxRequests: 15, // 15 requests
  windowMs: 60000, // per minute
  retryAfterMs: 20000 // 20 second cooldown
});

rateLimiter.register('ai-pricing-optimization', {
  maxRequests: 5, // 5 requests
  windowMs: 60000, // per minute
  retryAfterMs: 60000 // 1 minute cooldown
});

// Export helper function for easy integration
export async function withRateLimit<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  return rateLimiter.trackRequest(key, fn);
}

// Export types
export type { RateLimitConfig, RateLimitEntry };
  