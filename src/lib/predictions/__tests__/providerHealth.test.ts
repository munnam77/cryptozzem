import { ProviderHealthMonitor, type ProviderStatus } from '../providerHealth';

describe('ProviderHealthMonitor', () => {
  let monitor: ProviderHealthMonitor;

  beforeEach(() => {
    // Reset singleton instance
    (ProviderHealthMonitor as any).instance = null;
    monitor = ProviderHealthMonitor.getInstance();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should track provider status correctly', () => {
    monitor.recordSuccess('Twitter', Date.now(), 100);
    const status = monitor.getProviderStatus('Twitter');
    expect(status.status).toBe('healthy');

    // Record multiple errors
    for (let i = 0; i < 3; i++) {
      monitor.recordError('Twitter', new Error('API Error'));
    }
    expect(monitor.getProviderStatus('Twitter').status).toBe('degraded');

    // Record more errors to trigger down status
    for (let i = 0; i < 5; i++) {
      monitor.recordError('Twitter', new Error('API Error'));
    }
    expect(monitor.getProviderStatus('Twitter').status).toBe('down');
  });

  it('should track error rates over time', () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    // Record initial errors
    for (let i = 0; i < 3; i++) {
      monitor.recordError('Reddit', new Error('API Error'));
    }
    expect(monitor.getProviderStatus('Reddit').status).toBe('degraded');

    // Move time forward and record successes
    jest.spyOn(Date, 'now').mockImplementation(() => now + 300000); // 5 minutes
    for (let i = 0; i < 5; i++) {
      monitor.recordSuccess('Reddit', Date.now(), 150);
    }
    expect(monitor.getProviderStatus('Reddit').status).toBe('healthy');
  });

  it('should provide health status for all providers', () => {
    monitor.recordSuccess('Twitter', Date.now(), 100);
    monitor.recordError('Reddit', new Error('API Error'));
    monitor.recordError('News', new Error('Timeout'));

    const status = monitor.getAllStatus();
    expect(status).toHaveLength(3);
    expect(status.find((s: ProviderStatus) => s.provider === 'Twitter')?.status).toBe('healthy');
    expect(status.find((s: ProviderStatus) => s.provider === 'Reddit')?.status).toBe('degraded');
    expect(status.find((s: ProviderStatus) => s.provider === 'News')?.status).toBe('degraded');
  });

  it('should reset provider status', () => {
    monitor.recordError('Twitter', new Error('API Error'));
    expect(monitor.getProviderStatus('Twitter').status).toBe('degraded');

    monitor.reset('Twitter');
    expect(monitor.getProviderStatus('Twitter').status).toBe('healthy');
  });

  it('should track error types', () => {
    monitor.recordError('Twitter', new Error('Rate limit exceeded'));
    monitor.recordError('Twitter', new Error('Rate limit exceeded'));
    monitor.recordError('Twitter', new Error('Network timeout'));

    const status = monitor.getAllStatus();
    const twitterStatus = status.find((s: ProviderStatus) => s.provider === 'Twitter');
    expect(twitterStatus?.lastError).toBe('Network timeout');
    expect(twitterStatus?.errorCount).toBe(3);
  });

  it('should handle recovery after downtime', () => {
    // Put provider in down state
    for (let i = 0; i < 10; i++) {
      monitor.recordError('News', new Error('API Error'));
    }
    expect(monitor.getProviderStatus('News').status).toBe('down');

    // Record some successes
    for (let i = 0; i < 5; i++) {
      monitor.recordSuccess('News');
    }
    expect(monitor.getProviderStatus('News').status).toBe('degraded');

    // More successes should restore to healthy
    for (let i = 0; i < 5; i++) {
      monitor.recordSuccess('News');
    }
    expect(monitor.getProviderStatus('News').status).toBe('healthy');
  });

  it('should maintain separate status for each provider', () => {
    // Twitter: healthy
    monitor.recordSuccess('Twitter');
    monitor.recordSuccess('Twitter');

    // Reddit: degraded
    monitor.recordError('Reddit', new Error('API Error'));
    monitor.recordError('Reddit', new Error('API Error'));

    // News: down
    for (let i = 0; i < 10; i++) {
      monitor.recordError('News', new Error('API Error'));
    }

    const status = monitor.getAllStatus();
    expect(status.find((s: ProviderStatus) => s.provider === 'Twitter')?.status).toBe('healthy');
    expect(status.find((s: ProviderStatus) => s.provider === 'Reddit')?.status).toBe('degraded');
    expect(status.find((s: ProviderStatus) => s.provider === 'News')?.status).toBe('down');
  });

  test('tracks provider latency correctly', () => {
    monitor.recordSuccess('Twitter', 100);
    monitor.recordSuccess('Twitter', 200);
    monitor.recordSuccess('Twitter', 300);

    const status = monitor.getProviderStatus('Twitter');
    expect(status).toBeTruthy();
    expect(status?.latency.avg).toBe(200);
    expect(status?.latency.min).toBe(100);
    expect(status?.latency.max).toBe(300);
    expect(status?.latency.samples).toBe(3);
  });

  test('categorizes errors correctly', () => {
    monitor.recordError('Reddit', new Error('rate limit exceeded'));
    monitor.recordError('Reddit', new Error('network timeout'));
    monitor.recordError('Reddit', new Error('authentication failed'));

    const status = monitor.getProviderStatus('Reddit');
    expect(status).toBeTruthy();
    expect(status?.errors.rateLimit).toBe(1);
    expect(status?.errors.network).toBe(1);
    expect(status?.errors.auth).toBe(1);
    expect(status?.errors.total).toBe(3);
  });

  test('calculates health status correctly', () => {
    // Healthy - just rate limits
    monitor.recordError('Twitter', new Error('rate limit exceeded'));
    expect(monitor.getProviderStatus('Twitter')?.status).toBe('healthy');

    // Degraded - some errors
    for (let i = 0; i < 5; i++) {
      monitor.recordSuccess('Reddit', 100);
    }
    monitor.recordError('Reddit', new Error('network error'));
    expect(monitor.getProviderStatus('Reddit')?.status).toBe('degraded');

    // Down - auth error
    monitor.recordError('News', new Error('authentication failed'));
    expect(monitor.getProviderStatus('News')?.status).toBe('down');
  });

  test('cleans up old status entries', () => {
    monitor.recordSuccess('Twitter', 100);
    
    // Advance time past TTL
    jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes
    
    expect(monitor.getProviderStatus('Twitter')).toBeNull();
    expect(monitor.getAllStatus()).toHaveLength(0);
  });

  test('maintains separate stats per provider', () => {
    monitor.recordSuccess('Twitter', 100);
    monitor.recordError('Reddit', new Error('network error'));
    monitor.recordSuccess('News', 200);

    const allStatus = monitor.getAllStatus();
    expect(allStatus).toHaveLength(3);
    
    const statusMap = new Map(allStatus.map(s => [s.provider, s]));
    expect(statusMap.get('Twitter')?.status).toBe('healthy');
    expect(statusMap.get('Reddit')?.status).toBe('degraded');
    expect(statusMap.get('News')?.status).toBe('healthy');
  });

  it('should track latency statistics', () => {
    // Record some latency values
    monitor.recordSuccess('Twitter', Date.now(), 100);
    monitor.recordSuccess('Twitter', Date.now(), 200);
    monitor.recordSuccess('Twitter', Date.now(), 300);

    const status = monitor.getProviderStatus('Twitter');
    expect(status.latency.avg).toBeCloseTo(200);
    expect(status.latency.min).toBe(100);
    expect(status.latency.max).toBe(300);
    expect(status.latency.samples).toBe(3);
  });

  it('should categorize different types of errors', () => {
    monitor.recordError('Twitter', new Error('Rate limit exceeded'));
    monitor.recordError('Twitter', new Error('Network timeout'));
    monitor.recordError('Twitter', new Error('Authentication failed'));

    const status = monitor.getProviderStatus('Twitter');
    expect(status.errors.rateLimit).toBe(1);
    expect(status.errors.network).toBe(1);
    expect(status.errors.auth).toBe(1);
    expect(status.errors.total).toBe(3);
  });

  it('should reset provider statistics', () => {
    monitor.recordError('Twitter', new Error('API Error'));
    monitor.recordSuccess('Twitter', Date.now(), 100);
    
    monitor.reset('Twitter');
    const status = monitor.getProviderStatus('Twitter');
    expect(status.status).toBe('healthy');
    expect(status.errorCount).toBe(0);
    expect(status.latency.samples).toBe(0);
    expect(status.errors.total).toBe(0);
  });

  it('should maintain separate statistics for each provider', () => {
    // Twitter: healthy with good latency
    monitor.recordSuccess('Twitter', Date.now(), 50);
    monitor.recordSuccess('Twitter', Date.now(), 60);

    // Reddit: degraded with errors
    monitor.recordError('Reddit', new Error('Rate limit'));
    monitor.recordError('Reddit', new Error('Network error'));

    // News: down with high latency
    for (let i = 0; i < 10; i++) {
      monitor.recordError('News', new Error('Timeout'));
    }

    const status = monitor.getAllStatus();
    const twitter = status.find((s: ProviderStatus) => s.provider === 'Twitter');
    const reddit = status.find((s: ProviderStatus) => s.provider === 'Reddit');
    const news = status.find((s: ProviderStatus) => s.provider === 'News');

    expect(twitter?.status).toBe('healthy');
    expect(twitter?.latency.avg).toBeLessThan(100);
    
    expect(reddit?.status).toBe('degraded');
    expect(reddit?.errors.total).toBe(2);
    
    expect(news?.status).toBe('down');
    expect(news?.errorCount).toBe(10);
  });
});