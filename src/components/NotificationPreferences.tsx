import React, { useState, useEffect } from 'react';
import { Switch } from '@radix-ui/react-switch';
import { useNotifications } from '../contexts/NotificationContext';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';

interface NotificationSetting {
  id: keyof NotificationTypes;
  label: string;
  description: string;
}

interface NotificationTypes {
  like: boolean;
  comment: boolean;
  achievement: boolean;
  signal: boolean;
  mention: boolean;
}

const notificationSettings: NotificationSetting[] = [
  {
    id: 'like',
    label: 'Likes',
    description: 'When someone likes your signals or comments'
  },
  {
    id: 'comment',
    label: 'Comments',
    description: 'When someone comments on your signals'
  },
  {
    id: 'achievement',
    label: 'Achievements',
    description: 'When you unlock new achievements'
  },
  {
    id: 'signal',
    label: 'Signals',
    description: 'When your followed traders share new signals'
  },
  {
    id: 'mention',
    label: 'Mentions',
    description: 'When someone mentions you in a comment'
  }
];

export function NotificationPreferences() {
  const { updatePreferences } = useNotifications();
  const [types, setTypes] = useState<NotificationTypes>({
    like: true,
    comment: true,
    achievement: true,
    signal: true,
    mention: true
  });
  const [channels, setChannels] = useState({
    email: true,
    push: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleTypeToggle = async (type: keyof NotificationTypes) => {
    const newTypes = {
      ...types,
      [type]: !types[type]
    };
    setTypes(newTypes);
    await savePreferences(newTypes, channels);
  };

  const handleChannelToggle = async (channel: 'email' | 'push') => {
    const newChannels = {
      ...channels,
      [channel]: !channels[channel]
    };
    setChannels(newChannels);
    await savePreferences(types, newChannels);
  };

  const savePreferences = async (
    updatedTypes: NotificationTypes,
    updatedChannels: { email: boolean; push: boolean }
  ) => {
    try {
      setIsSaving(true);
      await updatePreferences({
        ...updatedChannels,
        types: updatedTypes
      });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Notification Channels
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-200">Email</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Receive notifications via email
                  </div>
                </div>
              </div>
              <Switch
                checked={channels.email}
                onCheckedChange={() => handleChannelToggle('email')}
                disabled={isSaving}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-primary-dark',
                  channels.email ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-200 dark:bg-gray-700'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    channels.email ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-200">Push</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Receive push notifications on your devices
                  </div>
                </div>
              </div>
              <Switch
                checked={channels.push}
                onCheckedChange={() => handleChannelToggle('push')}
                disabled={isSaving}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-primary-dark',
                  channels.push ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Notification Types
          </h2>
          <div className="space-y-4">
            {notificationSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-200">
                    {setting.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {setting.description}
                  </div>
                </div>
                <Switch
                  checked={types[setting.id]}
                  onCheckedChange={() => handleTypeToggle(setting.id)}
                  disabled={isSaving}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-primary-dark',
                    types[setting.id] ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}