
/**
 * Server-side rate limiter for Supabase Edge Functions
 * Prevents API abuse with in-memory rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets when function cold-starts)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations (requests per window)
export const RATE_LIMITS = {
  AI_GENERATION: {
    requests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  EMAIL_SEND: {
    requests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  PDF_GENERATION: {
    requests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  limit: number;
}

/**
 * Check if a user has exceeded their rate limit
 * @param userId - User ID to check
 * @param limitType - Type of rate limit to apply
 * @returns Rate limit result with allowed status and metadata
 */
export function checkRateLimit(
  userId: string,
  limitType: keyof typeof RATE_LIMITS
): RateLimitResult {
  const now = Date.now();
  const limit = RATE_LIMITS[limitType];
  const key = `${userId}:${limitType}`;
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  
  // Reset if window has expired
  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + limit.windowMs,
    };
    rateLimitStore.set(key, entry);
  }
  
  // Check if limit exceeded
  const allowed = entry.count < limit.requests;
  
  if (allowed) {
    entry.count++;
    rateLimitStore.set(key, entry);
  }
  
  return {
    allowed,
    remaining: Math.max(0, limit.requests - entry.count),
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
    limit: limit.requests,
  };
}

/**
 * Clean up old rate limit entries (call periodically to prevent memory leaks)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];
  
  rateLimitStore.forEach((entry, key) => {
    if (now >= entry.resetTime + 60000) { // 1 minute grace period
      expiredKeys.push(key);
    }
  });
  
  expiredKeys.forEach(key => rateLimitStore.delete(key));
  
  if (expiredKeys.length > 0) {
    console.log(`[Rate Limiter] Cleaned up ${expiredKeys.length} expired entries`);
  }
}

// Auto-cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
