
/**
 * Request Pool Service
 * Manages concurrent requests and request deduplication
 */

// Request pooling to limit concurrent Supabase requests
const MAX_CONCURRENT_REQUESTS = 2;
let activeRequests = 0;

/**
 * Execute request with connection pooling to limit concurrent requests
 */
export async function executeWithPool<T>(requestFn: () => Promise<T>): Promise<T> {
  while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  activeRequests++;
  try {
    return await requestFn();
  } finally {
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
const MAX_REQUEST_AGE = 20000; // 20 seconds max age for in-flight requests

// Extend window type for debugging
declare global {
  interface Window {
    __inFlightRequests: Map<string, InFlightRequest>;
  }
}

// Expose for debugging in Diagnostics page
if (typeof window !== 'undefined') {
  window.__inFlightRequests = inFlightRequests;
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
export async function dedupedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  // Clear stale requests before checking
  clearStaleRequests();
  
  const existing = inFlightRequests.get(key);
  if (existing) {
    const age = Date.now() - existing.startTime;
    console.log(`[Dedup] Reusing in-flight request for ${key} (age: ${age}ms)`);
    return existing.promise as Promise<T>;
  }

  console.log(`[Dedup] Starting new request for ${key}`);
  
  // Create abort controller for this request
  const abortController = new AbortController();
  
  // Create promise with guaranteed cleanup
  const promise = (async () => {
    try {
      const result = await executeWithPool(requestFn);
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
      console.log(`[Dedup] Cleanup for ${key}: ${deleted ? 'success' : 'already removed'}`);
    }
  })();

  inFlightRequests.set(key, {
    promise,
    startTime: Date.now(),
    abortController
  });
  
  return promise as Promise<T>;
}
