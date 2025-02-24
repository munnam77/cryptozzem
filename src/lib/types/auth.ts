import { UserRole } from './roles';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  is2FAEnabled: boolean;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  dashboardLayout: string;
  alertSettings: AlertSetting[];
  widgetPreferences: Record<string, any>;
}

export interface AlertSetting {
  id: string;
  type: 'price' | 'sentiment' | 'technical';
  threshold: number;
  comparison: 'above' | 'below';
  enabled: boolean;
}

export interface DashboardLayout {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}