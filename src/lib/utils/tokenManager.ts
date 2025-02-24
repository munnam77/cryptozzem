import jwtDecode from 'jwt-decode';
import { secureStorage } from './secureStorage';

interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  userId: string;
}

interface TokenResponse {
  token: string;
  refreshToken: string;
}

export class TokenManager {
  private static instance: TokenManager;
  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_THRESHOLD = 300; // 5 minutes in seconds
  private refreshPromise: Promise<TokenResponse> | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async getValidToken(): Promise<string | null> {
    const token = await secureStorage.getItem(this.AUTH_TOKEN_KEY);
    if (!token) return null;

    if (this.isTokenExpired(token)) {
      return this.refreshAuthToken();
    }

    return token;
  }

  async setTokens(tokenResponse: TokenResponse): Promise<void> {
    await Promise.all([
      secureStorage.setItem(this.AUTH_TOKEN_KEY, tokenResponse.token),
      secureStorage.setItem(this.REFRESH_TOKEN_KEY, tokenResponse.refreshToken)
    ]);
  }

  async clearTokens(): Promise<void> {
    await Promise.all([
      secureStorage.removeItem(this.AUTH_TOKEN_KEY),
      secureStorage.removeItem(this.REFRESH_TOKEN_KEY)
    ]);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = jwtDecode<JWTPayload>(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp <= currentTime + this.TOKEN_EXPIRY_THRESHOLD;
    } catch {
      return true;
    }
  }

  private async refreshAuthToken(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performTokenRefresh();
    }

    try {
      const tokens = await this.refreshPromise;
      await this.setTokens(tokens);
      return tokens.token;
    } catch (error) {
      await this.clearTokens();
      return null;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<TokenResponse> {
    const refreshToken = await secureStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return response.json();
  }

  async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getValidToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const payload = jwtDecode<JWTPayload>(token);
      return !this.isTokenExpired(token);
    } catch {
      return false;
    }
  }
}