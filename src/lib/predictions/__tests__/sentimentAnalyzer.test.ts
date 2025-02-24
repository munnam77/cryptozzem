import { SentimentAnalyzer } from '../sentimentAnalyzer';
import { ConfigManager } from '../config';
import { ProviderHealthMonitor } from '../providerHealth';

jest.mock('../config');
jest.mock('../providerHealth');

describe('SentimentAnalyzer', () => {
  let configManager: jest.Mocked<ConfigManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    configManager = {
      getInstance: jest.fn().mockReturnThis(),
      getConfig: jest.fn().mockReturnValue({
        providers: {
          Twitter: {
            enabled: true,
            apiKeys: ['test-key'],
            weight: 0.4,
            retryStrategy: {
              attempts: 3,
              baseDelay: 100,
              maxDelay: 1000,
              timeout: 500
            }
          },
          Reddit: {
            enabled: true,
            apiKeys: ['id:secret'],
            weight: 0.3,
            retryStrategy: {
              attempts: 3,
              baseDelay: 100,
              maxDelay: 1000,
              timeout: 500
            }
          },
          News: {
            enabled: true,
            apiKeys: ['news-key'],
            weight: 0.3,
            retryStrategy: {
              attempts: 3,
              baseDelay: 100,
              maxDelay: 1000,
              timeout: 500
            }
          }
        },
        updateInterval: 1800000,
        minConfidence: 0.6
      })
    } as unknown as jest.Mocked<ConfigManager>;

    (ConfigManager.getInstance as jest.Mock).mockReturnValue(configManager);

    (ProviderHealthMonitor.getInstance as jest.Mock).mockReturnValue({
      recordSuccess: jest.fn(),
      recordError: jest.fn()
    });

    // Reset singleton instance
    (SentimentAnalyzer as any).instance = null;
  });

  it('should initialize providers with API keys', () => {
    const analyzer = SentimentAnalyzer.getInstance();
    expect(analyzer).toBeDefined();
  });

  it('should handle provider failures gracefully', async () => {
    const analyzer = SentimentAnalyzer.getInstance();
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new Error('Rate limit'))
      .mockRejectedValueOnce(new Error('Rate limit'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{
            text: 'Very bullish on BTC',
            public_metrics: { like_count: 100, retweet_count: 50 }
          }]
        })
      });

    global.fetch = mockFetch;

    const result = await analyzer.getSentiment('BTC');
    
    expect(result).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should weight sentiment scores correctly', async () => {
    const analyzer = SentimentAnalyzer.getInstance();
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [{
          text: 'Very bullish on BTC',
          public_metrics: { like_count: 100, retweet_count: 50 }
        }]
      })
    });

    global.fetch = mockFetch;

    const result = await analyzer.getSentiment('BTC');
    
    expect(result.sources).toHaveLength(3);
    expect(result.sources[0].weight).toBe(0.4); // Twitter weight
    expect(result.score).toBeDefined();
  });

  it('should handle all providers failing', async () => {
    const analyzer = SentimentAnalyzer.getInstance();
    const mockFetch = jest.fn().mockRejectedValue(new Error('API Error'));

    global.fetch = mockFetch;

    await expect(analyzer.getSentiment('BTC'))
      .rejects
      .toThrow('No sentiment data available');
  });

  it('should update provider health status', async () => {
    const analyzer = SentimentAnalyzer.getInstance();
    const healthMonitor = ProviderHealthMonitor.getInstance();
    const mockFetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{
            text: 'Bullish',
            public_metrics: { like_count: 10, retweet_count: 5 }
          }]
        })
      })
      .mockRejectedValue(new Error('API Error'));

    global.fetch = mockFetch;

    await analyzer.getSentiment('BTC');

    expect(healthMonitor.recordSuccess).toHaveBeenCalled();
    expect(healthMonitor.recordError).toHaveBeenCalled();
  });

  it('should respect provider weights in final score', async () => {
    const analyzer = SentimentAnalyzer.getInstance();
    const mockFetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ // Twitter (weight 0.4)
            text: 'Very bearish on BTC',
            public_metrics: { like_count: 100, retweet_count: 50 }
          }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: { // Reddit (weight 0.3)
            children: [{
              data: {
                title: 'Super bullish!',
                selftext: 'To the moon!',
                score: 1000
              }
            }]
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          articles: [{ // News (weight 0.3)
            title: 'BTC price surges',
            description: 'Massive rally incoming',
            publishedAt: new Date().toISOString()
          }]
        })
      });

    global.fetch = mockFetch;

    const result = await analyzer.getSentiment('BTC');
    
    // Negative Twitter (0.4) + Positive Reddit (0.3) + Positive News (0.3)
    // Should result in a slightly negative or neutral score
    expect(result.score).toBeDefined();
    expect(Math.abs(result.score)).toBeLessThan(0.5);
  });
});