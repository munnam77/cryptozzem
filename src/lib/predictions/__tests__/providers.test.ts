import { TwitterSentimentProvider, RedditSentimentProvider, NewsSentimentProvider } from '../providers';

describe('SentimentProviders', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  describe('TwitterSentimentProvider', () => {
    let provider: TwitterSentimentProvider;

    beforeEach(() => {
      provider = new TwitterSentimentProvider();
    });

    test('rotates API keys on rate limit', async () => {
      await provider.initialize('key1,key2,key3');
      
      // First call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([
          ['x-rate-limit-remaining', '0'],
          ['x-rate-limit-reset', (Date.now() / 1000 + 900).toString()]
        ]),
        json: () => Promise.resolve({ data: [] })
      });

      // Second call succeeds with different key
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([
          ['x-rate-limit-remaining', '100'],
          ['x-rate-limit-reset', (Date.now() / 1000 + 900).toString()]
        ]),
        json: () => Promise.resolve({ data: [] })
      });

      await provider.getScore('BTCUSDT');
      await provider.getScore('BTCUSDT');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0][0]).toContain('BTCUSDT');
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toContain('key1');
      expect(mockFetch.mock.calls[1][1].headers.Authorization).toContain('key2');
    });

    test('retries with exponential backoff on error', async () => {
      await provider.initialize('test-key');
      
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([
            ['x-rate-limit-remaining', '100'],
            ['x-rate-limit-reset', (Date.now() / 1000 + 900).toString()]
          ]),
          json: () => Promise.resolve({ data: [] })
        });

      const startTime = Date.now();
      await provider.getScore('BTCUSDT');
      const endTime = Date.now();

      expect(mockFetch).toHaveBeenCalledTimes(3);
      // Should have waited at least 3 seconds (1s + 2s for first two retries)
      expect(endTime - startTime).toBeGreaterThanOrEqual(3000);
    });
  });

  describe('RedditSentimentProvider', () => {
    let provider: RedditSentimentProvider;

    beforeEach(() => {
      provider = new RedditSentimentProvider();
    });

    test('refreshes access token when expired', async () => {
      await provider.initialize('client_id:client_secret');

      // First call to get token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          access_token: 'test-token',
          expires_in: 1 // Expire immediately for testing
        })
      });

      // Search call fails with 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      // Second token refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          access_token: 'new-token',
          expires_in: 3600
        })
      });

      // Final successful search
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { children: [] } })
      });

      await provider.getScore('BTCUSDT');

      expect(mockFetch).toHaveBeenCalledTimes(4);
      expect(mockFetch.mock.calls[0][0]).toContain('access_token');
      expect(mockFetch.mock.calls[2][0]).toContain('access_token');
      expect(mockFetch.mock.calls[3][1].headers.Authorization).toContain('new-token');
    });
  });

  describe('NewsSentimentProvider', () => {
    let provider: NewsSentimentProvider;

    beforeEach(() => {
      provider = new NewsSentimentProvider();
    });

    test('uses cache for repeated requests', async () => {
      await provider.initialize('test-key');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ articles: [] })
      });

      await provider.getScore('BTCUSDT');
      await provider.getScore('BTCUSDT');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('refreshes cache after timeout', async () => {
      await provider.initialize('test-key');

      jest.useFakeTimers();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ articles: [] })
      });

      await provider.getScore('BTCUSDT');
      
      // Advance time past cache duration
      jest.advanceTimersByTime(31 * 60 * 1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ articles: [] })
      });

      await provider.getScore('BTCUSDT');

      expect(mockFetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });
});