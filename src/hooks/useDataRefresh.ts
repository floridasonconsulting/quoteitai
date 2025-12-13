import { useEffect } from 'react';

export type DataRefreshEvent = 'customers-changed' | 'items-changed' | 'quotes-changed';

// Dispatch a data refresh event
export const dispatchDataRefresh = (eventType: DataRefreshEvent) => {
  window.dispatchEvent(new CustomEvent(eventType));
};

// Hook to listen for data refresh events
export const useDataRefresh = (eventType: DataRefreshEvent, callback: () => void) => {
  useEffect(() => {
    const handleRefresh = () => {
      callback();
    };

    window.addEventListener(eventType, handleRefresh);
    return () => window.removeEventListener(eventType, handleRefresh);
  }, [eventType, callback]);
};
