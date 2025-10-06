import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handlers - catch all unhandled errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[Global Error Handler]', {
    message,
    source,
    lineno,
    colno,
    error,
    timestamp: new Date().toISOString()
  });
  // Never reload on error - just log it
  return true; // Prevents default error handling
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString()
  });
  // Prevent default (which might reload)
  event.preventDefault();
});

// Register service worker with update detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, skip waiting but DON'T force reload
                // This prevents infinite reload loops during development
                console.log('New service worker available, will be used on next page load');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
