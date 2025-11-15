/**
 * Client-side rate limiter for API calls and user actions
 * Prevents abuse and ensures smooth user experience
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();

  /**
   * Check if an action is rate limited
   */
  check(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
    const fullKey = `${config.keyPrefix}:${key}`;
    const now = Date.now();
    
    let entry = this.storage.get(fullKey);

    // Clean up expired entry
    if (entry && now >= entry.resetAt) {
      this.storage.delete(fullKey);
      entry = undefined;
    }

    // Create new entry if needed
    if (!entry) {
      entry = {
        count: 0,
        resetAt: now + config.windowMs,
      };
      this.storage.set(fullKey, entry);
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    // Increment count
    entry.count++;

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string, keyPrefix: string): void {
    const fullKey = `${keyPrefix}:${key}`;
    this.storage.delete(fullKey);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now >= entry.resetAt) {
        this.storage.delete(key);
      }
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

/**
 * Rate limit configurations for different actions
 */
export const RATE_LIMITS = {
  // AI features (per user)
  AI_GENERATION: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: "ai-gen",
  },
  AI_RECOMMENDATIONS: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    keyPrefix: "ai-rec",
  },

  // Email sending (per user)
  SEND_EMAIL: {
    maxRequests: 5,
    windowMs: 60 * 1000,
    keyPrefix: "email",
  },
  SEND_FOLLOW_UP: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    keyPrefix: "follow-up",
  },

  // Quote operations (per user)
  CREATE_QUOTE: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    keyPrefix: "create-quote",
  },
  UPDATE_QUOTE: {
    maxRequests: 60,
    windowMs: 60 * 1000,
    keyPrefix: "update-quote",
  },

  // Public quote views (per IP/session)
  VIEW_PUBLIC_QUOTE: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    keyPrefix: "view-quote",
  },

  // Authentication (per IP)
  AUTH_ATTEMPT: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: "auth",
  },

  // API calls (per user)
  API_CALL: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    keyPrefix: "api",
  },
} as const;

/**
 * Check if an action is rate limited
 */
export function checkRateLimit(
  userId: string,
  action: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[action];
  return rateLimiter.check(userId, config);
}

/**
 * Reset rate limit for a user and action
 */
export function resetRateLimit(userId: string, action: keyof typeof RATE_LIMITS): void {
  const config = RATE_LIMITS[action];
  rateLimiter.reset(userId, config.keyPrefix);
}

/**
 * Wrapper for rate-limited async functions
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  action: keyof typeof RATE_LIMITS,
  getUserId: () => string
): T {
  return (async (...args: Parameters<T>) => {
    const userId = getUserId();
    const result = checkRateLimit(userId, action);

    if (!result.allowed) {
      throw new Error(
        `Rate limit exceeded. Please try again in ${result.resetIn} seconds.`
      );
    }

    return fn(...args);
  }) as T;
}
