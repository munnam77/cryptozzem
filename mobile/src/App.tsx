import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RootStackParamList } from './types/navigation';
import { StatusBar } from 'expo-status-bar';
import { MobileNotificationHandler } from './services/MobileNotificationHandler';
import { useAuth } from './contexts/AuthContext';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import SettingsScreen from './screens/SettingsScreen';
import PredictionDetailScreen from './screens/PredictionDetailScreen';
import AlertSettingsScreen from './screens/AlertSettingsScreen';
import NotificationPreferencesScreen from './screens/NotificationPreferencesScreen';
import PremiumFeaturesScreen from './screens/PremiumFeaturesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const notificationHandler = MobileNotificationHandler.getInstance();

function NavigationContent() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      notificationHandler.updatePushToken(user.id);
    }
  }, [user]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1E293B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerLeft: () => null }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen
        name="PredictionDetail"
        component={PredictionDetailScreen}
        options={{ title: 'Prediction Details' }}
      />
      <Stack.Screen
        name="AlertSettings"
        component={AlertSettingsScreen}
        options={{ title: 'Alert Settings' }}
      />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{ title: 'Notification Settings' }}
      />
      <Stack.Screen
        name="PremiumFeatures"
        component={PremiumFeaturesScreen}
        options={{ title: 'Premium Features' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    await notificationHandler.initialize();
    return notificationHandler.setupNotificationListeners();
  };

  return (
    <NavigationContainer>
      <ThemeProvider>
        <AuthProvider>
          <AlertProvider>
            <NotificationProvider>
              <NavigationContent />
              <StatusBar style="light" />
            </NotificationProvider>
          </AlertProvider>
        </AuthProvider>
      </ThemeProvider>
    </NavigationContainer>
  );
}