import React, { useState } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationErrorBoundary } from './NotificationErrorBoundary';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'achievement' | 'signal' | 'mention';
  content: string;
  link?: string;
  isRead: boolean;
  timestamp: Date;
}

export function NotificationCenter() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss } = useNotifications();

  return (
    <NotificationErrorBoundary>
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {unreadCount > 0 ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary dark:bg-primary-dark rounded-full" />
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-sm text-primary dark:text-primary-dark hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No notifications
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          'p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50',
                          !notification.isRead && 'bg-primary/5 dark:bg-primary-dark/5'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            {notification.link ? (
                              <a
                                href={notification.link}
                                className="text-sm text-gray-900 dark:text-white hover:underline"
                              >
                                {notification.content}
                              </a>
                            ) : (
                              <p className="text-sm text-gray-900 dark:text-white">
                                {notification.content}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => dismiss(notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NotificationErrorBoundary>
  );
}