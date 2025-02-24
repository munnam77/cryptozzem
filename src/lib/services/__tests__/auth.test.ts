import { AuthService } from '../auth';
import { TokenManager } from '../../utils/tokenManager';
import { SessionManager } from '../../utils/sessionManager';
import { AuthError } from '../../types/auth';

jest.mock('../../utils/tokenManager');
jest.mock('../../utils/sessionManager');

describe('AuthService', () => {
  let authService: AuthService;
  let mockFetch: jest.Mock;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTokenResponse = {
    user: mockUser,
    token: 'test.jwt.token',
    refreshToken: 'test.refresh.token'
  };

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    authService = new AuthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('HTTP Interceptor', () => {
    test('adds auth headers to requests', async () => {
      const mockHeaders = { Authorization: 'Bearer test.token' };
      (TokenManager.getInstance() as jest.Mocked<TokenManager>)
        .getAuthHeaders.mockResolvedValue(mockHeaders);
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockUser })
      });

      await authService.updateProfile({ username: 'newname' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining(mockHeaders)
        })
      );
    });

    test('handles 401 responses by ending session', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { code: 'unauthorized' } })
      });

      await expect(authService.updateProfile({ username: 'newname' }))
        .rejects
        .toThrow('Session expired');

      expect(SessionManager.getInstance().endSession).toHaveBeenCalled();
    });

    test('transforms API errors to AuthErrors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { code: 'custom_error', message: 'Custom error message' }
        })
      });

      await expect(authService.updateProfile({ username: 'newname' }))
        .rejects
        .toThrow(AuthError);
    });

    test('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      await expect(authService.updateProfile({ username: 'newname' }))
        .rejects
        .toThrow('Failed to connect to the server');
    });
  });

  describe('Authentication Methods', () => {
    test('handles successful login', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTokenResponse })
      });

      const user = await authService.login('test@example.com', 'password');
      
      expect(user).toEqual(mockUser);
      expect(TokenManager.getInstance().setTokens).toHaveBeenCalledWith({
        token: mockTokenResponse.token,
        refreshToken: mockTokenResponse.refreshToken
      });
    });

    test('handles invalid credentials', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { code: 'invalid_credentials', message: 'Invalid email or password' }
        })
      });

      await expect(authService.login('test@example.com', 'wrong'))
        .rejects
        .toThrow('Invalid email or password');
    });

    test('handles successful registration', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockTokenResponse })
      });

      const user = await authService.register('test@example.com', 'password', 'testuser');
      
      expect(user).toEqual(mockUser);
      expect(TokenManager.getInstance().setTokens).toHaveBeenCalled();
    });

    test('handles duplicate email registration', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { code: 'email_exists', message: 'Email already exists' }
        })
      });

      await expect(authService.register('existing@example.com', 'password', 'testuser'))
        .rejects
        .toThrow('An account with this email already exists');
    });

    test('handles logout', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null })
      });

      await authService.logout();
      
      expect(TokenManager.getInstance().clearTokens).toHaveBeenCalled();
    });

    test('validates reset tokens', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: true })
      });

      const isValid = await authService.validateResetToken('valid.token');
      expect(isValid).toBe(true);
    });

    test('handles invalid reset tokens', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { code: 'invalid_token', message: 'Token expired' }
        })
      });

      await expect(authService.validateResetToken('invalid.token'))
        .rejects
        .toThrow('Reset token is invalid or has expired');
    });
  });

  describe('Profile Management', () => {
    test('updates user profile', async () => {
      const updatedUser = { ...mockUser, username: 'newname' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: updatedUser })
      });

      const result = await authService.updateProfile({ username: 'newname' });
      expect(result).toEqual(updatedUser);
    });

    test('handles profile update errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { code: 'validation_error', message: 'Invalid username' }
        })
      });

      await expect(authService.updateProfile({ username: '' }))
        .rejects
        .toThrow(AuthError);
    });
  });
});