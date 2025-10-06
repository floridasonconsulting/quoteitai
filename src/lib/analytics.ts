/**
 * Enhanced non-blocking analytics helper
 * Features: offline queue, retry logic, idle callback, batching, timeouts
 */

interface AnalyticsEvent {
  event: string;
  timestamp: string;
  payload?: Record<string, any>;
}

interface QueuedEvent {
  event: AnalyticsEvent;
  retries: number;
  nextRetry?: number;
}

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay
const REQUEST_TIMEOUT = 3000; // 3 second timeout
const BATCH_SIZE = 5;
const BATCH_DELAY = 2000; // 2 seconds

// Queue management
let eventQueue: QueuedEvent[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    processQueue();
  });
  window.addEventListener('offline', () => {
    isOnline = false;
  });
}

/**
 * Send analytics event without blocking UI
 * Uses requestIdleCallback to defer processing during critical rendering
 */
export function sendAnalytics(eventName: string, payload?: Record<string, any>): void {
  const event: AnalyticsEvent = {
    event: eventName,
    timestamp: new Date().toISOString(),
    payload,
  };

  // Use requestIdleCallback for non-blocking execution
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => queueEvent(event), { timeout: 2000 });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => queueEvent(event), 0);
  }
}

/**
 * Queue an event for sending
 */
function queueEvent(event: AnalyticsEvent): void {
  eventQueue.push({ event, retries: 0 });
  
  // Process immediately if online, otherwise wait for connection
  if (isOnline) {
    scheduleBatchSend();
  }
}

/**
 * Schedule batch send with debouncing
 */
function scheduleBatchSend(): void {
  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }
  
  // Send immediately if queue is full, otherwise debounce
  if (eventQueue.length >= BATCH_SIZE) {
    processBatch();
  } else {
    batchTimeout = setTimeout(processBatch, BATCH_DELAY);
  }
}

/**
 * Process a batch of events
 */
async function processBatch(): Promise<void> {
  if (eventQueue.length === 0) return;
  
  // Take up to BATCH_SIZE events
  const batch = eventQueue.splice(0, BATCH_SIZE);
  
  for (const queuedEvent of batch) {
    await sendEventWithRetry(queuedEvent);
  }
  
  // Continue processing if more events remain
  if (eventQueue.length > 0) {
    scheduleBatchSend();
  }
}

/**
 * Process the entire queue (called when coming back online)
 */
function processQueue(): void {
  if (eventQueue.length > 0 && isOnline) {
    scheduleBatchSend();
  }
}

/**
 * Send a single event with retry logic
 */
async function sendEventWithRetry(queuedEvent: QueuedEvent): Promise<void> {
  const { event, retries } = queuedEvent;
  
  // Check if we should retry (exponential backoff)
  if (queuedEvent.nextRetry && Date.now() < queuedEvent.nextRetry) {
    eventQueue.push(queuedEvent); // Re-queue for later
    return;
  }
  
  try {
    await sendWithTimeout(event);
  } catch (error) {
    console.debug('[Analytics] Send failed:', error);
    
    // Retry with exponential backoff
    if (retries < MAX_RETRIES) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, retries);
      queuedEvent.retries++;
      queuedEvent.nextRetry = Date.now() + delay;
      eventQueue.push(queuedEvent);
    } else {
      console.debug('[Analytics] Max retries exceeded, dropping event:', event.event);
    }
  }
}

/**
 * Send event with timeout protection
 */
async function sendWithTimeout(event: AnalyticsEvent): Promise<void> {
  const data = JSON.stringify(event);
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics`;
  
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('[Analytics] Sending event:', event.event, 'to', url);
    console.time(`analytics-${event.event}`);
  }
  
  // Try sendBeacon first (most reliable, no timeout needed)
  if (navigator.sendBeacon) {
    const blob = new Blob([data], { type: 'application/json' });
    const sent = navigator.sendBeacon(url, blob);
    
    if (import.meta.env.DEV) {
      console.timeEnd(`analytics-${event.event}`);
      console.log('[Analytics] sendBeacon result:', sent);
    }
    
    if (sent) {
      return; // Success
    }
  }
  
  // Fallback to fetch with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      keepalive: true,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (import.meta.env.DEV) {
      console.timeEnd(`analytics-${event.event}`);
      console.log('[Analytics] Fetch response:', response.status, response.ok);
    }
    
    if (!response.ok && response.status !== 202) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (import.meta.env.DEV) {
      console.error('[Analytics] Failed to send:', error);
    }
    
    throw error;
  }
}

/**
 * Track page view (non-blocking)
 */
export function trackPageView(pageName: string): void {
  sendAnalytics('page_view', { page: pageName });
}

/**
 * Track user action (non-blocking)
 */
export function trackAction(actionName: string, metadata?: Record<string, any>): void {
  sendAnalytics('user_action', { action: actionName, ...metadata });
}
