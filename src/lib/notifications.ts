export interface FollowUpNotification {
  quoteId: string;
  quoteNumber: string;
  customerName: string;
  followUpDate: string;
  notified: boolean;
  createdAt: string;
}

const NOTIFICATIONS_KEY = 'followUpNotifications';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export function scheduleFollowUpNotification(
  quoteId: string,
  quoteNumber: string,
  customerName: string,
  followUpDate: string
): void {
  const notifications = getFollowUpNotifications();
  
  // Remove existing notification for this quote
  const filtered = notifications.filter(n => n.quoteId !== quoteId);
  
  // Add new notification
  const newNotification: FollowUpNotification = {
    quoteId,
    quoteNumber,
    customerName,
    followUpDate,
    notified: false,
    createdAt: new Date().toISOString(),
  };
  
  filtered.push(newNotification);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
}

export function getFollowUpNotifications(): FollowUpNotification[] {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function markNotificationAsShown(quoteId: string): void {
  const notifications = getFollowUpNotifications();
  const updated = notifications.map(n =>
    n.quoteId === quoteId ? { ...n, notified: true } : n
  );
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
}

export function removeFollowUpNotification(quoteId: string): void {
  const notifications = getFollowUpNotifications();
  const filtered = notifications.filter(n => n.quoteId !== quoteId);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
}

export function showNotification(title: string, body: string, data?: Record<string, unknown>): void {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data?.quoteId || 'quote-notification',
      data,
      requireInteraction: true,
    });
    
    notification.onclick = () => {
      window.focus();
      if (data?.quoteId) {
        window.location.href = `/quotes/${data.quoteId}`;
      }
      notification.close();
    };
  }
}

export function checkDueFollowUps(): void {
  const notifications = getFollowUpNotifications();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  notifications.forEach(notification => {
    if (!notification.notified) {
      const followUpDate = notification.followUpDate.split('T')[0];
      
      if (followUpDate <= today) {
        showNotification(
          `Follow up: ${notification.customerName}`,
          `Quote ${notification.quoteNumber} needs follow-up today`,
          { quoteId: notification.quoteId }
        );
        markNotificationAsShown(notification.quoteId);
      }
    }
  });
}

export function getDueFollowUpQuoteIds(): string[] {
  const notifications = getFollowUpNotifications();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  return notifications
    .filter(n => {
      const followUpDate = n.followUpDate.split('T')[0];
      return followUpDate <= today;
    })
    .map(n => n.quoteId);
}
