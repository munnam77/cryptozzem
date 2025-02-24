import { TokenManager } from './tokenManager';
import { User } from '../types/auth';

interface SessionState {
  lastActivity: number;
  user: User | null;
}

export class SessionManager {
  private static instance: SessionManager;
  private readonly SESSION_KEY = 'crypto_zzem_session';
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly ACTIVITY_CHECK_INTERVAL = 60 * 1000; // 1 minute
  private tokenManager: TokenManager;
  private activityInterval: NodeJS.Timer | null = null;
  private sessionListeners: Array<(user: User | null) => void> = [];

  private constructor() {
    this.tokenManager = TokenManager.getInstance();
    this.startActivityMonitoring();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private startActivityMonitoring() {
    // Reset activity timer on user interactions
    window.addEventListener('mousemove', () => this.updateLastActivity());
    window.addEventListener('keypress', () => this.updateLastActivity());
    window.addEventListener('click', () => this.updateLastActivity());
    window.addEventListener('scroll', () => this.updateLastActivity());

    // Check session activity periodically
    this.activityInterval = setInterval(() => {
      this.checkSessionActivity();
    }, this.ACTIVITY_CHECK_INTERVAL);
  }

  private async checkSessionActivity() {
    const session = await this.getSession();
    if (!session) return;

    const inactiveTime = Date.now() - session.lastActivity;
    if (inactiveTime > this.INACTIVITY_TIMEOUT) {
      await this.endSession();
    }
  }

  private async updateLastActivity() {
    const session = await this.getSession();
    if (session) {
      session.lastActivity = Date.now();
      await this.saveSession(session);
    }
  }

  private async getSession(): Promise<SessionState | null> {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    if (!sessionData) return null;

    try {
      return JSON.parse(sessionData);
    } catch {
      return null;
    }
  }

  private async saveSession(session: SessionState) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  async startSession(user: User) {
    const session: SessionState = {
      lastActivity: Date.now(),
      user
    };
    await this.saveSession(session);
    this.notifyListeners(user);
  }

  async endSession() {
    localStorage.removeItem(this.SESSION_KEY);
    await this.tokenManager.clearTokens();
    this.notifyListeners(null);

    // Redirect to login if not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user || null;
  }

  async updateUser(user: User) {
    const session = await this.getSession();
    if (session) {
      session.user = user;
      await this.saveSession(session);
      this.notifyListeners(user);
    }
  }

  onSessionChange(callback: (user: User | null) => void): () => void {
    this.sessionListeners.push(callback);
    
    // Initial state
    this.getCurrentUser().then(user => callback(user));

    return () => {
      this.sessionListeners = this.sessionListeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(user: User | null) {
    this.sessionListeners.forEach(listener => listener(user));
  }

  cleanup() {
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
    }
  }
}