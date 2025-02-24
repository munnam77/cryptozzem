import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export class MobileNotificationHandler {
  private static instance: MobileNotificationHandler;
  private pushToken: string | null = null;

  private constructor() {}

  static getInstance(): MobileNotificationHandler {
    if (!this.instance) {
      this.instance = new MobileNotificationHandler();
    }
    return this.instance;
  }

  async initialize() {
    if (!Constants.isDevice) {
      return;
    }

    await this.configurePushNotifications();
    await this.registerForPushNotifications();
  }

  private async configurePushNotifications() {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  private async registerForPushNotifications() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      // Use different tokens for development and production
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
        development: __DEV__
      });

      this.pushToken = token.data;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  async updatePushToken(userId: string): Promise<void> {
    if (!this.pushToken) return;

    try {
      const response = await fetch('/api/users/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token: this.pushToken,
          platform: Platform.OS,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update push token');
      }
    } catch (error) {
      console.error('Error updating push token:', error);
    }
  }

  async setupNotificationListeners() {
    const notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Received notification:', notification);
      }
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        const { data } = response.notification.request.content;
        this.handleNotificationResponse(data);
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  private handleNotificationResponse(data: any) {
    // Handle notification interaction based on type
    switch (data.type) {
      case 'signal':
        // Navigate to signal details
        break;
      case 'comment':
        // Navigate to discussion
        break;
      case 'achievement':
        // Navigate to achievements
        break;
      default:
        break;
    }
  }

  clearAllNotifications() {
    Notifications.dismissAllNotificationsAsync();
  }

  async scheduleLocalNotification(title: string, body: string, data: any = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Immediate notification
    });
  }
}