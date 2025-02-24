import { TokenManager } from '../tokenManager';
import { secureStorage } from '../secureStorage';
import jwtDecode from 'jwt-decode';

jest.mock('../secureStorage');
jest.mock('jwt-decode');

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  const mockValidToken = 'valid.jwt.token';
  const mockExpiredToken = 'expired.jwt.token';
  const mockRefreshToken = 'refresh.token';

  beforeEach(() => {
    jest.clearAllMocks();
    tokenManager = TokenManager.getInstance();
    global.fetch = jest.fn();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = TokenManager.getInstance();
    const instance2 = TokenManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('getValidToken', () => {
    test('returns null when no token exists', async () => {
      (secureStorage.getItem as jest.Mock).mockResolvedValue(null);
      const token = await tokenManager.getValidToken();
      expect(token).toBeNull();
    });

    test('returns valid token without refresh', async () => {
      (secureStorage.getItem as jest.Mock).mockResolvedValue(mockValidToken);
      (jwtDecode as jest.Mock).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600
      });

      const token = await tokenManager.getValidToken();
      expect(token).toBe(mockValidToken);
    });

    test('refreshes expired token', async () => {
      const newToken = 'new.jwt.token';
      (secureStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(mockExpiredToken)
        .mockResolvedValueOnce(mockRefreshToken);
      (jwtDecode as jest.Mock).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) - 60
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: newToken, refreshToken: 'new.refresh.token' })
      });

      const token = await tokenManager.getValidToken();
      expect(token).toBe(newToken);
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', expect.any(Object));
    });

    test('handles refresh failure', async () => {
      (secureStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(mockExpiredToken)
        .mockResolvedValueOnce(mockRefreshToken);
      (jwtDecode as jest.Mock).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) - 60
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false
      });

      const token = await tokenManager.getValidToken();
      expect(token).toBeNull();
      expect(secureStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('token management', () => {
    test('sets tokens correctly', async () => {
      const tokens = {
        token: 'new.token',
        refreshToken: 'new.refresh'
      };

      await tokenManager.setTokens(tokens);
      
      expect(secureStorage.setItem).toHaveBeenCalledWith('auth_token', tokens.token);
      expect(secureStorage.setItem).toHaveBeenCalledWith('refresh_token', tokens.refreshToken);
    });

    test('clears tokens correctly', async () => {
      await tokenManager.clearTokens();
      
      expect(secureStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(secureStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('token validation', () => {
    test('validates token correctly', async () => {
      (jwtDecode as jest.Mock).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600
      });

      const isValid = await tokenManager.validateToken(mockValidToken);
      expect(isValid).toBe(true);
    });

    test('invalidates expired token', async () => {
      (jwtDecode as jest.Mock).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) - 60
      });

      const isValid = await tokenManager.validateToken(mockExpiredToken);
      expect(isValid).toBe(false);
    });

    test('handles invalid token format', async () => {
      (jwtDecode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const isValid = await tokenManager.validateToken('invalid.token');
      expect(isValid).toBe(false);
    });
  });

  describe('getAuthHeaders', () => {
    test('returns authorization header with valid token', async () => {
      (secureStorage.getItem as jest.Mock).mockResolvedValue(mockValidToken);
      (jwtDecode as jest.Mock).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600
      });

      const headers = await tokenManager.getAuthHeaders();
      expect(headers).toEqual({
        Authorization: `Bearer ${mockValidToken}`
      });
    });

    test('returns empty headers when no token available', async () => {
      (secureStorage.getItem as jest.Mock).mockResolvedValue(null);

      const headers = await tokenManager.getAuthHeaders();
      expect(headers).toEqual({});
    });
  });

  describe('refresh token rotation', () => {
    test('prevents multiple simultaneous refresh requests', async () => {
      (secureStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(mockExpiredToken)
        .mockResolvedValueOnce(mockRefreshToken);
      (jwtDecode as jest.Mock).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) - 60
      });
      
      const mockResponse = {
        token: 'new.token',
        refreshToken: 'new.refresh'
      };
      
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        }), 100))
      );

      // Trigger multiple refresh requests simultaneously
      const requests = Array(3).fill(null).map(() => tokenManager.getValidToken());
      const results = await Promise.all(requests);

      // All requests should return the same token
      expect(results.every(token => token === mockResponse.token)).toBe(true);
      // Fetch should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});