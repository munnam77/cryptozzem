import { AlertSetting } from '../types/auth';
import { UserRole, getRolePermissions } from '../types/roles';

export interface AlertRule {
  value: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  target: string;
  type: 'price' | 'sentiment' | 'volume' | 'technical';
}

export class AlertManager {
  private static instance: AlertManager;
  
  static getInstance(): AlertManager {
    if (!this.instance) {
      this.instance = new AlertManager();
    }
    return this.instance;
  }

  async createAlert(userId: string, userRole: UserRole, alert: Omit<AlertSetting, 'id'>): Promise<AlertSetting> {
    const userPermissions = getRolePermissions(userRole);
    const currentAlerts = await this.getUserAlerts(userId);
    
    if (currentAlerts.length >= userPermissions.maxAlerts) {
      throw new Error(`Maximum alerts (${userPermissions.maxAlerts}) reached for your account tier`);
    }

    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, alert })
    });

    if (!response.ok) {
      throw new Error('Failed to create alert');
    }

    return response.json();
  }

  async getUserAlerts(userId: string): Promise<AlertSetting[]> {
    const response = await fetch(`/api/alerts/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user alerts');
    }
    return response.json();
  }

  async updateAlert(userId: string, alertId: string, updates: Partial<AlertSetting>): Promise<AlertSetting> {
    const response = await fetch(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates })
    });

    if (!response.ok) {
      throw new Error('Failed to update alert');
    }

    return response.json();
  }

  async deleteAlert(userId: string, alertId: string): Promise<void> {
    const response = await fetch(`/api/alerts/${alertId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error('Failed to delete alert');
    }
  }

  async toggleAlert(userId: string, alertId: string, enabled: boolean): Promise<AlertSetting> {
    return this.updateAlert(userId, alertId, { enabled });
  }
}