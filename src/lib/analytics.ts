/**
 * Non-blocking analytics helper
 * Uses sendBeacon for fire-and-forget analytics that never blocks the UI
 */

interface AnalyticsEvent {
  event: string;
  timestamp: string;
  payload?: Record<string, any>;
}

/**
 * Send analytics event without blocking UI
 * Uses navigator.sendBeacon if available, falls back to fetch with keepalive
 */
export function sendAnalytics(eventName: string, payload?: Record<string, any>): void {
  const event: AnalyticsEvent = {
    event: eventName,
    timestamp: new Date().toISOString(),
    payload,
  };

  const data = JSON.stringify(event);
  const url = '/~api/analytics';

  // Prefer sendBeacon for guaranteed delivery
  if (navigator.sendBeacon) {
    const blob = new Blob([data], { type: 'application/json' });
    const sent = navigator.sendBeacon(url, blob);
    
    if (!sent) {
      console.warn('[Analytics] sendBeacon failed, falling back to fetch');
      sendWithFetch(url, data);
    }
  } else {
    // Fallback to fetch with keepalive
    sendWithFetch(url, data);
  }
}

/**
 * Fallback method using fetch with keepalive flag
 */
function sendWithFetch(url: string, data: string): void {
  fetch(url, {
    method: 'POST',
    body: data,
    headers: {
      'Content-Type': 'application/json',
    },
    keepalive: true, // Ensures request continues even if page unloads
  }).catch((error) => {
    // Silently ignore analytics errors - they should never impact UX
    console.debug('[Analytics] Error sending event:', error);
  });
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
