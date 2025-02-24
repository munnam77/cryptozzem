import { renderHook, act } from '@testing-library/react';
import { useProviderHealth } from '../useProviderHealth';
import { ProviderHealthMonitor } from '../../lib/predictions/providerHealth';
import { SentimentAnalyzer } from '../../lib/predictions/sentimentAnalyzer';

jest.mock('../../lib/predictions/providerHealth');
jest.mock('../../lib/predictions/sentimentAnalyzer');

describe('useProviderHealth', () => {
  let mockMonitor: jest.Mocked<ProviderHealthMonitor>;
  let mockAnalyzer: jest.Mocked<SentimentAnalyzer>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockMonitor = {
      getInstance: jest.fn().mockReturnThis(),
      getAllStatus: jest.fn().mockReturnValue([])
    } as any;

    mockAnalyzer = {
      getInstance: jest.fn().mockReturnThis(),
      getProviderHealth: jest.fn().mockReturnValue({})
    } as any;

    (ProviderHealthMonitor.getInstance as jest.Mock).mockReturnValue(mockMonitor);
    (SentimentAnalyzer.getInstance as jest.Mock).mockReturnValue(mockAnalyzer);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('returns initial health status', () => {
    mockMonitor.getAllStatus.mockReturnValue([
      {
        provider: 'Twitter',
        status: 'healthy',
        lastCheck: Date.now(),
        errors: { total: 0, rateLimit: 0, network: 0, auth: 0, other: 0 },
        latency: { avg: 100, min: 50, max: 150, samples: 10 }
      }
    ]);

    mockAnalyzer.getProviderHealth.mockReturnValue({
      Twitter: 'healthy'
    });

    const { result } = renderHook(() => useProviderHealth());

    expect(result.current.healthStatus).toHaveLength(1);
    expect(result.current.providerStates).toHaveProperty('Twitter', 'healthy');
    expect(result.current.totalErrors).toBe(0);
    expect(result.current.healthyProviders).toBe(1);
  });

  test('updates health status periodically', () => {
    const { result } = renderHook(() => useProviderHealth(1000));

    mockMonitor.getAllStatus
      .mockReturnValueOnce([{ 
        provider: 'Twitter',
        status: 'healthy',
        lastCheck: Date.now(),
        errors: { total: 0, rateLimit: 0, network: 0, auth: 0, other: 0 },
        latency: { avg: 100, min: 50, max: 150, samples: 10 }
      }])
      .mockReturnValueOnce([{
        provider: 'Twitter',
        status: 'degraded',
        lastCheck: Date.now(),
        errors: { total: 1, rateLimit: 0, network: 1, auth: 0, other: 0 },
        latency: { avg: 200, min: 50, max: 350, samples: 11 }
      }]);

    mockAnalyzer.getProviderHealth
      .mockReturnValueOnce({ Twitter: 'healthy' })
      .mockReturnValueOnce({ Twitter: 'degraded' });

    // Initial state
    expect(result.current.healthStatus[0].status).toBe('healthy');

    // Advance time and trigger update
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Check updated state
    expect(result.current.healthStatus[0].status).toBe('degraded');
    expect(result.current.totalErrors).toBe(1);
  });

  test('correctly determines system health', () => {
    mockMonitor.getAllStatus.mockReturnValue([
      {
        provider: 'Twitter',
        status: 'healthy',
        lastCheck: Date.now(),
        errors: { total: 0, rateLimit: 0, network: 0, auth: 0, other: 0 },
        latency: { avg: 100, min: 50, max: 150, samples: 10 }
      },
      {
        provider: 'Reddit',
        status: 'degraded',
        lastCheck: Date.now(),
        errors: { total: 1, rateLimit: 1, network: 0, auth: 0, other: 0 },
        latency: { avg: 200, min: 50, max: 350, samples: 11 }
      },
      {
        provider: 'News',
        status: 'healthy',
        lastCheck: Date.now(),
        errors: { total: 0, rateLimit: 0, network: 0, auth: 0, other: 0 },
        latency: { avg: 150, min: 100, max: 200, samples: 5 }
      }
    ]);

    const { result } = renderHook(() => useProviderHealth());

    expect(result.current.isSystemHealthy).toBe(true);
    expect(result.current.healthyProviders).toBe(2);
    expect(result.current.totalErrors).toBe(1);
  });

  test('detects unhealthy system state', () => {
    mockMonitor.getAllStatus.mockReturnValue([
      {
        provider: 'Twitter',
        status: 'down',
        lastCheck: Date.now(),
        errors: { total: 3, rateLimit: 0, network: 0, auth: 3, other: 0 },
        latency: { avg: 100, min: 50, max: 150, samples: 10 }
      },
      {
        provider: 'Reddit',
        status: 'degraded',
        lastCheck: Date.now(),
        errors: { total: 2, rateLimit: 1, network: 1, auth: 0, other: 0 },
        latency: { avg: 200, min: 50, max: 350, samples: 11 }
      }
    ]);

    const { result } = renderHook(() => useProviderHealth());

    expect(result.current.isSystemHealthy).toBe(false);
    expect(result.current.healthyProviders).toBe(0);
    expect(result.current.totalErrors).toBe(5);
  });
});