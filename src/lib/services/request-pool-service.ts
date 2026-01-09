
/**
 * Request Pool Service
 * Manages concurrent requests and request deduplication
 */

// Request pooling to limit concurrent Supabase requests
// Increased from 5 to 8 to handle more parallel dashboard components
const MAX_CONCURRENT_REQUESTS = 8;
let activeRequests = 0;

/**
 * Execute request with connection pooling to limit concurrent requests
 * Integrates internal timeout to ensure pool slots are always released
 */
export async function executeWithPool<T>(
  requestFn: () => Promise<T>,
  timeoutMs: number = 30000,
  label: string = 'unlabeled'
): Promise<T> {
  const startTime = Date.now();
  const POOL_WAIT_TIMEOUT = 10000; // 10 seconds timeout for waiting on pool

  while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    if (Date.now() - startTime > POOL_WAIT_TIMEOUT) {
      console.warn(`[Pool] Wait timeout exceeded for [${label}], forcing request through. Current active:`, activeRequests);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  activeRequests++;
  console.debug(`[Pool] Request [${label}] starting. Active: ${activeRequests}, Timeout: ${timeoutMs}ms`);
  const requestStartTime = Date.now();

  try {
    // Run with timeout to ensure we don't hold the pool slot forever
    // Ensure timeoutMs is at least 1s to avoid immediate timeouts from undefined/0
    const effectiveTimeout = Math.max(timeoutMs, 1000);
    console.debug(`[Pool] Request [${label}] effective timeout: ${effectiveTimeout}ms`);

    // Safely invoke the request function
    let promise: Promise<T>;
    try {
      promise = requestFn();
      console.debug(`[Pool] Request [${label}] promise created successfully`);
    } catch (syncError) {
      console.error(`[Pool] Request [${label}] failed synchronously:`, syncError);
      throw syncError;
    }

    const result = await withTimeout(promise, effectiveTimeout);
    console.debug(`[Pool] Request [${label}] completed in ${Date.now() - requestStartTime}ms`);
    return result;
  } catch (error) {
    console.error(`[Pool] Request [${label}] failed after ${Date.now() - requestStartTime}ms:`, error);
    throw error;
  } finally {
    activeRequests--;
    console.debug(`[Pool] Request [${label}] finished. Active: ${activeRequests}`);
  }
}

// Request deduplication map with timestamp tracking and abort controllers
interface InFlightRequest {
  promise: Promise<unknown>;
  startTime: number;
  abortController: AbortController;
}

const inFlightRequests = new Map<string, InFlightRequest>();
const MAX_REQUEST_AGE = 60000; // Increased to 60 seconds to match/exceed typical timeouts

// Extend window type for debugging
declare global {
  interface Window {
    __inFlightRequests: Map<string, InFlightRequest>;
  }
}

// Expose for debugging in Diagnostics page
if (typeof window !== 'undefined') {
  window.__inFlightRequests = inFlightRequests;
  (window as any).__resetRequestPool = () => {
    console.debug('[Pool] Manual reset triggered');
    activeRequests = 0;
    clearInFlightRequests();
    return "Pool reset successfully";
  };

  // Auto-cleanup stale requests every 30 seconds to prevent pool exhaustion
  setInterval(() => {
    clearStaleRequests();
    // Also reset activeRequests if it's stuck at max but no real requests are in flight
    if (activeRequests >= MAX_CONCURRENT_REQUESTS && inFlightRequests.size === 0) {
      console.warn('[Pool] Detected stuck activeRequests counter, resetting to 0');
      activeRequests = 0;
    }
  }, 30000);
}

/**
 * Clear all in-flight requests (emergency cleanup)
 */
export function clearInFlightRequests(): void {
  const count = inFlightRequests.size;
  if (count > 0) {
    console.log(`[Dedup] Clearing ${count} in-flight requests`);
    // Abort all controllers
    inFlightRequests.forEach((request) => {
      request.abortController.abort();
    });
    inFlightRequests.clear();
  }
}

/**
 * Clear stale requests that have been in-flight too long
 */
function clearStaleRequests(): void {
  const now = Date.now();
  const staleKeys: string[] = [];

  inFlightRequests.forEach((request, key) => {
    if (now - request.startTime > MAX_REQUEST_AGE) {
      staleKeys.push(key);
      // Abort stale request
      request.abortController.abort();
    }
  });

  if (staleKeys.length > 0) {
    console.log(`[Dedup] Clearing ${staleKeys.length} stale requests:`, staleKeys);
    staleKeys.forEach(key => inFlightRequests.delete(key));
  }
}

/**
 * Timeout utility to prevent hanging promises
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Request deduplication wrapper with abort support
 * Reuses in-flight requests for the same key to prevent duplicate API calls
 */
export async function dedupedRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  // Clear stale requests before checking
  clearStaleRequests();

  const existing = inFlightRequests.get(key);
  if (existing) {
    const age = Date.now() - existing.startTime;
    console.debug(`[Dedup] Reusing in-flight request for ${key} (age: ${age}ms)`);
    return existing.promise as Promise<T>;
  }

  console.debug(`[Dedup] Starting new request for ${key}`);

  // Create abort controller for this request
  const abortController = new AbortController();

  // Create promise with guaranteed cleanup
  const promise = (async () => {
    try {
      const result = await executeWithPool(requestFn, timeoutMs, key);
      return result;
    } catch (error) {
      // Don't log abort errors
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error(`[Dedup] Request failed for ${key}:`, error);
      }
      throw error;
    } finally {
      // Always cleanup, even on error or timeout
      const deleted = inFlightRequests.delete(key);
      console.debug(`[Dedup] Cleanup for ${key}: ${deleted ? 'success' : 'already removed'}`);
    }
  })();

  inFlightRequests.set(key, {
    promise,
    startTime: Date.now(),
    abortController
  });

  return promise as Promise<T>;
}
