import { User, AuthError } from '../types/auth';
import { TokenManager } from '../utils/tokenManager';
import { SessionManager } from '../utils/sessionManager';
import { ApiHealthMonitor } from '../utils/apiHealthMonitor';
import { SecureStorage } from '../utils/secureStorage';

interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export class AuthService {
  private tokenManager: TokenManager;
  private sessionManager: SessionManager;
  private healthMonitor: ApiHealthMonitor;
  private secureStorage: SecureStorage;
  private readonly API_BASE = '/api/auth';

  constructor() {
    this.tokenManager = TokenManager.getInstance();
    this.sessionManager = SessionManager.getInstance();
    this.healthMonitor = ApiHealthMonitor.getInstance();
    this.secureStorage = SecureStorage.getInstance();

    // Configure retry settings for auth endpoints
    this.healthMonitor.updateRetryConfig({
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000,
      timeout: 10000
    });
  }

  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const fullEndpoint = `${this.API_BASE}${endpoint}`;
    
    return this.healthMonitor.executeWithRetry(fullEndpoint, async () => {
      try {
        const headers = await this.tokenManager.getAuthHeaders();
        const response = await fetch(fullEndpoint, {
          ...options,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (response.status === 401) {
          await this.sessionManager.endSession();
          throw new AuthError('unauthorized', 'Session expired. Please log in again.');
        }

        const result: ApiResponse<T> = await response.json();

        if (!response.ok) {
          throw new AuthError(
            result.error?.code || 'unknown',
            result.error?.message || 'An unexpected error occurred'
          );
        }

        return result.data as T;
      } catch (err) {
        if (err instanceof AuthError) {
          throw err;
        }
        throw new AuthError('network_error', 'Failed to connect to the server');
      }
    });
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const { user, token, refreshToken } = await this.fetchWithAuth<{
        user: User;
        token: string;
        refreshToken: string;
      }>('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      await this.tokenManager.setTokens({ token, refreshToken });
      return user;
    } catch (err) {
      if (err instanceof AuthError && err.code === 'invalid_credentials') {
        throw new AuthError('invalid_credentials', 'Invalid email or password');
      }
      throw err;
    }
  }

  async register(email: string, password: string, username: string): Promise<User> {
    try {
      const { user, token, refreshToken } = await this.fetchWithAuth<{
        user: User;
        token: string;
        refreshToken: string;
      }>('/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, username })
      });

      await this.tokenManager.setTokens({ token, refreshToken });
      return user;
    } catch (err) {
      if (err instanceof AuthError && err.code === 'email_exists') {
        throw new AuthError('email_exists', 'An account with this email already exists');
      }
      throw err;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.fetchWithAuth('/logout', { method: 'POST' });
    } finally {
      await this.tokenManager.clearTokens();
    }
  }

  async validateResetToken(token: string): Promise<boolean> {
    try {
      await this.fetchWithAuth('/validate-reset-token', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
      return true;
    } catch (err) {
      if (err instanceof AuthError && err.code === 'invalid_token') {
        throw new AuthError('invalid_token', 'Reset token is invalid or has expired');
      }
      throw err;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.fetchWithAuth('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.fetchWithAuth('/request-reset', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.fetchWithAuth('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  getEndpointHealth(endpoint: string): { isHealthy: boolean; avgResponseTime: number } {
    const status = this.healthMonitor.getEndpointHealth(`${this.API_BASE}${endpoint}`);
    return {
      isHealthy: status.isHealthy,
      avgResponseTime: status.avgResponseTime
    };
  }

  cleanup(): void {
    this.healthMonitor.cleanup();
  }

  async setup2FA(): Promise<{ qrCode: string; backupCodes: string[] }> {
    const response = await this.fetchWithAuth<{ qrCode: string; backupCodes: string[] }>('/2fa/setup', {
      method: 'POST'
    });
    return response;
  }

  async verify2FA(code: string): Promise<boolean> {
    const response = await this.fetchWithAuth<{ verified: boolean }>('/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    return response.verified;
  }

  async validate2FACode(code: string): Promise<{ token: string }> {
    const response = await this.fetchWithAuth<{ token: string }>('/2fa/validate', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    return response;
  }

  async disable2FA(code: string): Promise<boolean> {
    const response = await this.fetchWithAuth<{ disabled: boolean }>('/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    return response.disabled;
  }
}