import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';

export function NotificationPreferencesScreen() {
  const { updatePreferences } = useNotifications();
  const [preferences, setPreferences] = useState({
    channels: {
      email: true,
      push: true
    },
    types: {
      like: true,
      comment: true,
      achievement: true,
      signal: true,
      mention: true
    }
  });

  const handleChannelToggle = async (channel: 'email' | 'push') => {
    const newPreferences = {
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: !preferences.channels[channel]
      }
    };
    setPreferences(newPreferences);
    await updatePreferences({
      ...newPreferences.channels,
      types: newPreferences.types
    });
  };

  const handleTypeToggle = async (type: keyof typeof preferences.types) => {
    const newPreferences = {
      ...preferences,
      types: {
        ...preferences.types,
        [type]: !preferences.types[type]
      }
    };
    setPreferences(newPreferences);
    await updatePreferences({
      ...newPreferences.channels,
      types: newPreferences.types
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Channels</Text>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Email Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive notifications via email
            </Text>
          </View>
          <Switch
            value={preferences.channels.email}
            onValueChange={() => handleChannelToggle('email')}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
          />
        </View>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive push notifications on your device
            </Text>
          </View>
          <Switch
            value={preferences.channels.push}
            onValueChange={() => handleChannelToggle('push')}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Likes</Text>
            <Text style={styles.settingDescription}>
              When someone likes your signals or comments
            </Text>
          </View>
          <Switch
            value={preferences.types.like}
            onValueChange={() => handleTypeToggle('like')}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
          />
        </View>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Comments</Text>
            <Text style={styles.settingDescription}>
              When someone comments on your signals
            </Text>
          </View>
          <Switch
            value={preferences.types.comment}
            onValueChange={() => handleTypeToggle('comment')}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
          />
        </View>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Achievements</Text>
            <Text style={styles.settingDescription}>
              When you unlock new achievements
            </Text>
          </View>
          <Switch
            value={preferences.types.achievement}
            onValueChange={() => handleTypeToggle('achievement')}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
          />
        </View>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Signals</Text>
            <Text style={styles.settingDescription}>
              When your followed traders share new signals
            </Text>
          </View>
          <Switch
            value={preferences.types.signal}
            onValueChange={() => handleTypeToggle('signal')}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
          />
        </View>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Mentions</Text>
            <Text style={styles.settingDescription}>
              When someone mentions you in a comment
            </Text>
          </View>
          <Switch
            value={preferences.types.mention}
            onValueChange={() => handleTypeToggle('mention')}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    backgroundColor: '#ffffff',
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    maxWidth: '80%',
  },
});