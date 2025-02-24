import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '../components/NotificationCenter';
import { NotificationService } from '../lib/services/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  types: {
    like: boolean;
    comment: boolean;
    achievement: boolean;
    signal: boolean;
    mention: boolean;
  }
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
const notificationService = NotificationService.getInstance();

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    const unsubscribe = notificationService.subscribe(handleNewNotification);
    notificationService.connect();

    return () => {
      unsubscribe();
      notificationService.disconnect();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const fetchedNotifications = await notificationService.getNotifications();
      setNotifications(fetchedNotifications);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const dismiss = async (id: string) => {
    try {
      await notificationService.dismiss(id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const updatePreferences = async (preferences: NotificationPreferences) => {
    try {
      await notificationService.updatePreferences(preferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    updatePreferences
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}