import { Notification } from '../components/NotificationCenter';

export class NotificationService {
  private static instance: NotificationService;
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private listeners: ((notification: Notification) => void)[] = [];

  private constructor() {
    this.baseUrl = '/api/notifications';
  }

  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  async connect() {
    try {
      this.ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/notifications`);
      
      this.ws.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        this.notifyListeners(notification);
      };

      this.ws.onclose = () => {
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.connect(), 5000);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }

  subscribe(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(notification: Notification) {
    this.listeners.forEach(listener => listener(notification));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async getNotifications(): Promise<Notification[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  }

  async markAsRead(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${notificationId}/read`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
  }

  async markAllAsRead(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/read-all`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to mark all notifications as read');
  }

  async dismiss(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${notificationId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to dismiss notification');
  }

  async getUnreadCount(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/unread-count`);
    if (!response.ok) throw new Error('Failed to fetch unread count');
    const data = await response.json();
    return data.count;
  }

  async updatePreferences(preferences: {
    email: boolean;
    push: boolean;
    types: {
      like: boolean;
      comment: boolean;
      achievement: boolean;
      signal: boolean;
      mention: boolean;
    }
  }): Promise<void> {
    const response = await fetch(`${this.baseUrl}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    if (!response.ok) throw new Error('Failed to update notification preferences');
  }
}