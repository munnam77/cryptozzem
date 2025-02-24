import { SessionManager } from '../sessionManager';
import { TokenManager } from '../tokenManager';
import { User } from '../../types/auth';

jest.mock('../tokenManager');

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    sessionManager = SessionManager.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
    sessionManager.cleanup();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = SessionManager.getInstance();
    const instance2 = SessionManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('starts session with user', async () => {
    await sessionManager.startSession(mockUser);
    const currentUser = await sessionManager.getCurrentUser();
    expect(currentUser).toEqual(mockUser);
  });

  test('ends session and clears data', async () => {
    await sessionManager.startSession(mockUser);
    await sessionManager.endSession();
    
    const currentUser = await sessionManager.getCurrentUser();
    expect(currentUser).toBeNull();
    expect(TokenManager.getInstance().clearTokens).toHaveBeenCalled();
  });

  test('updates user data in session', async () => {
    await sessionManager.startSession(mockUser);
    
    const updatedUser = { ...mockUser, username: 'newusername' };
    await sessionManager.updateUser(updatedUser);
    
    const currentUser = await sessionManager.getCurrentUser();
    expect(currentUser).toEqual(updatedUser);
  });

  test('monitors user activity', async () => {
    await sessionManager.startSession(mockUser);
    
    // Simulate user activity
    window.dispatchEvent(new MouseEvent('mousemove'));
    
    const session = JSON.parse(localStorage.getItem('crypto_zzem_session')!);
    expect(Date.now() - session.lastActivity).toBeLessThan(1000);
  });

  test('ends session on inactivity', async () => {
    await sessionManager.startSession(mockUser);
    
    // Advance time past inactivity timeout
    jest.advanceTimersByTime(31 * 60 * 1000);
    
    const currentUser = await sessionManager.getCurrentUser();
    expect(currentUser).toBeNull();
  });

  test('notifies listeners of session changes', async () => {
    const mockListener = jest.fn();
    const unsubscribe = sessionManager.onSessionChange(mockListener);
    
    // Initial state (null)
    expect(mockListener).toHaveBeenCalledWith(null);
    
    // Start session
    await sessionManager.startSession(mockUser);
    expect(mockListener).toHaveBeenCalledWith(mockUser);
    
    // End session
    await sessionManager.endSession();
    expect(mockListener).toHaveBeenCalledWith(null);
    
    // Cleanup
    unsubscribe();
  });

  test('preserves session across page reloads', async () => {
    await sessionManager.startSession(mockUser);
    
    // Create new instance to simulate page reload
    const newSessionManager = SessionManager.getInstance();
    const currentUser = await newSessionManager.getCurrentUser();
    
    expect(currentUser).toEqual(mockUser);
  });

  test('handles multiple activity events', async () => {
    await sessionManager.startSession(mockUser);
    const events = ['mousemove', 'keypress', 'click', 'scroll'];
    
    events.forEach(eventType => {
      if (eventType === 'keypress') {
        window.dispatchEvent(new KeyboardEvent(eventType));
      } else {
        window.dispatchEvent(new Event(eventType));
      }
    });
    
    const session = JSON.parse(localStorage.getItem('crypto_zzem_session')!);
    expect(session.user).toEqual(mockUser);
  });

  test('cleanup stops activity monitoring', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    sessionManager.cleanup();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  test('redirects to login on session end', async () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '', pathname: '/dashboard' } as Location;

    await sessionManager.endSession();
    expect(window.location.href).toBe('/login');

    window.location = originalLocation;
  });
});