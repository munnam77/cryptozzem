import { ApiHealthMonitor } from '../apiHealthMonitor';
import { AuthError } from '../../types/auth';

describe('ApiHealthMonitor', () => {
  let apiHealthMonitor: ApiHealthMonitor;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    apiHealthMonitor = ApiHealthMonitor.getInstance();
    apiHealthMonitor.updateRetryConfig({
      maxAttempts: 3,
      baseDelay: 100,
      maxDelay: 500,
      timeout: 1000
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    apiHealthMonitor.cleanup();
  });

  describe('Singleton Pattern', () => {
    test('returns same instance', () => {
      const instance1 = ApiHealthMonitor.getInstance();
      const instance2 = ApiHealthMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Retry Mechanism', () => {
    test('retries failed operations', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const result = await apiHealthMonitor.executeWithRetry(
        '/api/test',
        operation
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('respects max attempts', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new Error('Network error'));

      await expect(
        apiHealthMonitor.executeWithRetry('/api/test', operation)
      ).rejects.toThrow('Network error');

      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('does not retry auth errors', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new AuthError('invalid_token', 'Token expired'));

      await expect(
        apiHealthMonitor.executeWithRetry('/api/test', operation)
      ).rejects.toThrow('Token expired');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('implements exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new Error('Network error'));

      const promise = apiHealthMonitor.executeWithRetry('/api/test', operation);
      
      // First attempt fails immediately
      expect(operation).toHaveBeenCalledTimes(1);
      
      // Second attempt should happen after baseDelay
      jest.advanceTimersByTime(100);
      expect(operation).toHaveBeenCalledTimes(2);
      
      // Third attempt should happen after baseDelay * 2
      jest.advanceTimersByTime(200);
      expect(operation).toHaveBeenCalledTimes(3);

      await expect(promise).rejects.toThrow('Network error');
    });
  });

  describe('Health Monitoring', () => {
    test('tracks endpoint health status', async () => {
      const endpoint = '/api/health';
      mockFetch.mockResolvedValueOnce({ ok: true });

      await apiHealthMonitor.executeWithRetry(endpoint, () => Promise.resolve('success'));
      
      const health = apiHealthMonitor.getEndpointHealth(endpoint);
      expect(health.isHealthy).toBe(true);
      expect(health.failureCount).toBe(0);
    });

    test('updates failure count on errors', async () => {
      const endpoint = '/api/health';
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        apiHealthMonitor.executeWithRetry(endpoint, operation)
      ).rejects.toThrow();

      const health = apiHealthMonitor.getEndpointHealth(endpoint);
      expect(health.isHealthy).toBe(false);
      expect(health.failureCount).toBe(3);
    });

    test('tracks response times', async () => {
      const endpoint = '/api/health';
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)  // Start time
        .mockReturnValueOnce(1100); // End time

      await apiHealthMonitor.executeWithRetry(endpoint, () => Promise.resolve('success'));
      
      const health = apiHealthMonitor.getEndpointHealth(endpoint);
      expect(health.avgResponseTime).toBeGreaterThan(0);
    });

    test('performs periodic health checks', () => {
      const endpoint = '/api/health';
      mockFetch.mockResolvedValue({ ok: true });

      // Trigger health check interval
      jest.advanceTimersByTime(60000);

      expect(mockFetch).toHaveBeenCalledWith(
        endpoint,
        expect.objectContaining({
          method: 'HEAD'
        })
      );
    });
  });

  describe('Configuration', () => {
    test('updates retry configuration', () => {
      const newConfig = {
        maxAttempts: 5,
        baseDelay: 200
      };

      apiHealthMonitor.updateRetryConfig(newConfig);

      // Attempt an operation that will use the new config
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      const promise = apiHealthMonitor.executeWithRetry('/api/test', operation);

      // Should attempt 5 times with 200ms base delay
      jest.advanceTimersByTime(200);
      expect(operation).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(400);
      expect(operation).toHaveBeenCalledTimes(3);

      jest.advanceTimersByTime(800);
      expect(operation).toHaveBeenCalledTimes(4);

      jest.advanceTimersByTime(1600);
      expect(operation).toHaveBeenCalledTimes(5);

      return expect(promise).rejects.toThrow('Network error');
    });
  });

  describe('Cleanup', () => {
    test('stops health check timer', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      apiHealthMonitor.cleanup();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});