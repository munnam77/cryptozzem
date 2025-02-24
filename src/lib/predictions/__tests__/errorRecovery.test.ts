import { CircuitBreaker, ExponentialBackoff, RetryStrategy, withRetry, withFallback, RetryError } from '../errorRecovery';
import { ConfigManager } from '../config';

jest.mock('../config');

describe('Error Recovery', () => {
  describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000
      });
    });

    test('opens after failure threshold', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));

      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    test('transitions to half-open after reset timeout', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockRejectedValueOnce(new Error('Test error'))
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValueOnce('success');

      // Fail three times to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should succeed and close circuit
      const result = await circuitBreaker.execute(operation);
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('ExponentialBackoff', () => {
    let backoff: ExponentialBackoff;

    beforeEach(() => {
      jest.useFakeTimers();
      backoff = new ExponentialBackoff({
        initialDelay: 100,
        maxDelay: 1000,
        factor: 2,
        jitter: false
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('retries with increasing delays', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const promise = backoff.execute(operation);
      
      // First retry - 100ms
      jest.advanceTimersByTime(100);
      // Second retry - 200ms
      jest.advanceTimersByTime(200);
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('respects max delay', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      const promise = backoff.execute(operation);

      // Should cap at maxDelay (1000ms)
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(1000);
      }

      await expect(promise).rejects.toThrow();
    });
  });

  describe('RetryStrategy', () => {
    let retryStrategy: RetryStrategy;

    beforeEach(() => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000
      });

      const backoff = new ExponentialBackoff({
        initialDelay: 100,
        maxDelay: 1000,
        factor: 2,
        jitter: false
      });

      retryStrategy = new RetryStrategy(circuitBreaker, backoff);
    });

    test('combines circuit breaker and backoff', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return Promise.resolve('success');
      });

      const result = await retryStrategy.execute(operation);
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });
});

describe('Error Recovery System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ConfigManager.getInstance as jest.Mock).mockReturnValue({
      getConfig: () => ({
        providers: {
          TestProvider: {
            retryStrategy: {
              attempts: 3,
              baseDelay: 100,
              maxDelay: 1000,
              timeout: 500
            }
          }
        }
      })
    });
  });

  describe('withRetry', () => {
    it('should retry failed operations', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success');

      const result = await withRetry('TestProvider', mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should throw RetryError after max attempts', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(withRetry('TestProvider', mockOperation))
        .rejects
        .toThrow(RetryError);
    });

    it('should honor timeout setting', async () => {
      const mockOperation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      await expect(withRetry('TestProvider', mockOperation))
        .rejects
        .toThrow('Operation timed out');
    });
  });

  describe('withFallback', () => {
    it('should try providers in order until success', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Provider 1 failed'))
        .mockResolvedValueOnce('success');

      const result = await withFallback(
        ['Provider1', 'Provider2'],
        mockOperation
      );

      expect(result).toEqual({
        result: 'success',
        provider: 'Provider2'
      });
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should skip disabled providers', async () => {
      (ConfigManager.getInstance as jest.Mock).mockReturnValue({
        getConfig: () => ({
          providers: {
            Provider1: { enabled: false },
            Provider2: { enabled: true }
          }
        })
      });

      const mockOperation = jest.fn().mockResolvedValue('success');

      await withFallback(
        ['Provider1', 'Provider2'],
        mockOperation
      );

      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOperation).toHaveBeenCalledWith('Provider2');
    });

    it('should throw when all providers fail', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Failed'));

      await expect(withFallback(
        ['Provider1', 'Provider2'],
        mockOperation
      )).rejects.toThrow('All providers failed');
    });

    it('should call error handler for each failure', async () => {
      const mockErrorHandler = jest.fn();
      const mockOperation = jest.fn().mockRejectedValue(new Error('Failed'));

      await expect(withFallback(
        ['Provider1', 'Provider2'],
        mockOperation,
        mockErrorHandler
      )).rejects.toThrow();

      expect(mockErrorHandler).toHaveBeenCalledTimes(2);
    });
  });
});