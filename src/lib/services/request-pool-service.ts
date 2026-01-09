
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
  requestFn: (signal?: AbortSignal) => Promise<T>,
  timeoutMs: number = 30000,
  label: string = 'unlabeled',
  externalSignal?: AbortSignal
): Promise<T> {
  const startTime = Date.now();
  const POOL_WAIT_TIMEOUT = 10000; // 10 seconds timeout for waiting on pool

  while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    if (Date.now() - startTime > POOL_WAIT_TIMEOUT) {
      console.warn(`[Pool] Wait timeout exceeded for [${label}], forcing request through. Current active:`, activeRequests);
      break;
    }
    // Check if external signal was aborted while waiting
    if (externalSignal?.aborted) {
      throw new Error(`Request [${label}] aborted while waiting for pool`);
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  activeRequests++;
  console.log(`[Pool] 🚀 Request [${label}] starting. Active: ${activeRequests}, Timeout: ${timeoutMs}ms`);
  const requestStartTime = Date.now();
  const effectiveTimeout = Math.max(timeoutMs, 1000);

  // CRITICAL FIX: Create an internal controller that we can abort on timeout.
  // This ensures the underlying Supabase/Browser request is TRULY killed.
  const internalController = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[Pool] ⚠️ Request [${label}] forced abortion after ${effectiveTimeout}ms timeout`);
    internalController.abort();
  }, effectiveTimeout);

  // Link external signal to our internal controller
  const linkAbort = () => internalController.abort();
  if (externalSignal) {
    if (externalSignal.aborted) internalController.abort();
    else externalSignal.addEventListener('abort', linkAbort, { once: true });
  }

  try {
    // Race the request against a promise that rejects when the internal signal is aborted
    // This provides a consistent "Request timeout" error while ensuring abortion happens.
    const abortPromise = new Promise<never>((_, reject) => {
      const handleAbort = () => reject(new Error('Request timeout'));
      if (internalController.signal.aborted) {
        handleAbort();
      } else {
        internalController.signal.addEventListener('abort', handleAbort, { once: true });
      }
    });

    const result = await Promise.race([
      requestFn(internalController.signal),
      abortPromise
    ]);

    console.log(`[Pool] ✅ Request [${label}] succeeded in ${Date.now() - requestStartTime}ms. Slot released. Active: ${activeRequests - 1}`);
    return result;
  } catch (error) {
    const duration = Date.now() - requestStartTime;
    // Log failures, but be less noisy for intentional abortions
    if (error instanceof Error && (error.message === 'Request timeout' || error.name === 'AbortError')) {
      console.warn(`[Pool] ⏱️ Request [${label}] ${error.message === 'Request timeout' ? 'timed out' : 'aborted'} after ${duration}ms. Slot released. Active: ${activeRequests - 1}`);
    } else {
      console.error(`[Pool] ❌ Request [${label}] failed after ${duration}ms. Slot released. Active: ${activeRequests - 1}:`, error);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) externalSignal.removeEventListener('abort', linkAbort);
    activeRequests--;
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
  requestFn: (signal?: AbortSignal) => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  // Clear stale requests before checking
  clearStaleRequests();

  const existing = inFlightRequests.get(key);
  if (existing) {
    const age = Date.now() - existing.startTime;
    console.log(`[Dedup] ♻️ Reusing in-flight request for ${key} (age: ${age}ms)`);
    return existing.promise as Promise<T>;
  }

  console.log(`[Dedup] 🆕 Starting new request for ${key}`);

  // Create abort controller for this request
  const abortController = new AbortController();

  // Create promise with guaranteed cleanup
  const promise = (async () => {
    try {
      const result = await executeWithPool((s) => requestFn(s), timeoutMs, key, abortController.signal);
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
