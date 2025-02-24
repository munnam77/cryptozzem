import { User } from '../types/auth';

export interface DashboardLayout {
  id: string;
  name: string;
  grid: GridLayout[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GridLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  settings: Record<string, any>;
}

export class DashboardManager {
  private static instance: DashboardManager;
  
  static getInstance(): DashboardManager {
    if (!this.instance) {
      this.instance = new DashboardManager();
    }
    return this.instance;
  }

  async saveLayout(userId: string, layout: DashboardLayout): Promise<void> {
    const response = await fetch('/api/dashboard/layouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, layout })
    });

    if (!response.ok) {
      throw new Error('Failed to save dashboard layout');
    }
  }

  async getLayouts(userId: string): Promise<DashboardLayout[]> {
    const response = await fetch(`/api/dashboard/layouts/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard layouts');
    }
    return response.json();
  }

  async updateWidgetSettings(userId: string, widgetId: string, settings: Record<string, any>): Promise<void> {
    const response = await fetch(`/api/dashboard/widgets/${widgetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, settings })
    });

    if (!response.ok) {
      throw new Error('Failed to update widget settings');
    }
  }

  async deleteLayout(userId: string, layoutId: string): Promise<void> {
    const response = await fetch(`/api/dashboard/layouts/${layoutId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error('Failed to delete dashboard layout');
    }
  }
}