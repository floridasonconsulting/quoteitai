import { useEffect, useState } from 'react';
import {
  requestNotificationPermission,
  getNotificationPermission,
  checkDueFollowUps,
  getDueFollowUpQuoteIds,
} from '@/lib/notifications';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    getNotificationPermission()
  );
  const [dueFollowUpIds, setDueFollowUpIds] = useState<string[]>([]);

  useEffect(() => {
    // Check for due follow-ups every minute
    const interval = setInterval(() => {
      checkDueFollowUps();
      setDueFollowUpIds(getDueFollowUpQuoteIds());
    }, 60000); // 60 seconds

    // Initial check
    checkDueFollowUps();
    setDueFollowUpIds(getDueFollowUpQuoteIds());

    return () => clearInterval(interval);
  }, []);

  const requestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  };

  return {
    permission,
    requestPermission,
    isSupported: 'Notification' in window,
    dueFollowUpIds,
  };
}
