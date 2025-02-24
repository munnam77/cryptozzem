import { CircuitBreaker, ExponentialBackoff, RetryStrategy } from './errorRecovery';
import { ConfigManager, SentimentConfig } from './config';
import { ProviderHealthMonitor } from './providerHealth';

interface RetryStrategy {
  attempts: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
}

abstract class BaseProvider {
  protected retryStrategy: RetryStrategy;
  protected healthMonitor: ProviderHealthMonitor;

  constructor() {
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 5 * 60 * 1000 // 5 minutes
    });

    const backoff = new ExponentialBackoff({
      initialDelay: 1000,
      maxDelay: 30000,
      factor: 2,
      jitter: true
    });

    this.retryStrategy = new RetryStrategy(circuitBreaker, backoff);
    this.healthMonitor = ProviderHealthMonitor.getInstance();
  }

  protected abstract get providerName(): string;

  protected async executeWithRecovery<T>(
    operation: () => Promise<T>,
    errorHandler?: (error: Error) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await this.retryStrategy.execute(operation);
      this.healthMonitor.recordSuccess(this.providerName, Date.now() - startTime);
      return result;
    } catch (error) {
      this.healthMonitor.recordError(this.providerName, error as Error);
      if (errorHandler) {
        return errorHandler(error as Error);
      }
      throw error;
    }
  }
}

class TwitterSentimentProvider extends BaseProvider implements SentimentProvider {
  readonly name = 'Twitter';
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;
  private apiEndpoint = 'https://api.twitter.com/2/tweets/search/recent';
  private rateLimit = { remaining: 300, reset: 0 };

  protected get providerName(): string { return this.name; }

  async initialize(apiKey: string): Promise<void> {
    this.apiKeys = apiKey.split(',').map(k => k.trim());
    this.currentKeyIndex = 0;
  }

  private rotateApiKey(): void {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
  }

  private async makeRequest(query: string): Promise<any> {
    const operation = async () => {
      if (Date.now() < this.rateLimit.reset && this.rateLimit.remaining <= 0) {
        this.rotateApiKey();
        if (this.currentKeyIndex === 0) {
          throw new Error('All API keys rate limited');
        }
      }

      const response = await fetch(`${this.apiEndpoint}?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys[this.currentKeyIndex]}`,
          'Content-Type': 'application/json'
        }
      });

      this.rateLimit.remaining = parseInt(response.headers.get('x-rate-limit-remaining') || '0');
      this.rateLimit.reset = parseInt(response.headers.get('x-rate-limit-reset') || '0') * 1000;

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Twitter API rate limit exceeded');
        }
        throw new Error(`Twitter API error: ${response.statusText}`);
      }

      return await response.json();
    };

    return this.retryWithBackoff(operation, {
      attempts: 5,
      baseDelay: 2000
    });
  }

  async getScore(symbol: string): Promise<{ score: number; confidence: number; lastUpdated: number; }> {
    if (!this.apiKeys.length) {
      throw new Error('Twitter API credentials not configured');
    }

    return this.executeWithRecovery(
      async () => {
        const query = `${symbol} crypto -is:retweet lang:en`;
        const response = await this.makeRequest(query);

        if (!response.data || !response.data.length) {
          return {
            score: 0,
            confidence: 0,
            lastUpdated: Date.now()
          };
        }

        const { score, confidence } = this.analyzeSentiment(response.data);
        return {
          score,
          confidence,
          lastUpdated: Date.now()
        };
      },
      async (error) => {
        if (error.message.includes('rate limit')) {
          this.rotateApiKey();
          // Retry with new API key
          return this.getScore(symbol);
        }
        throw error;
      }
    );
  }

  // ...rest of existing TwitterSentimentProvider methods...
}

class RedditSentimentProvider extends BaseProvider implements SentimentProvider {
  readonly name = 'Reddit';
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  protected get providerName(): string { return this.name; }

  async getScore(symbol: string): Promise<{ score: number; confidence: number; lastUpdated: number; }> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Reddit API credentials not configured');
    }

    return this.executeWithRecovery(
      async () => {
        await this.ensureValidToken();
        const posts = await this.fetchPosts(symbol);
        const { score, confidence } = this.analyzeSentiment(posts);

        return {
          score,
          confidence,
          lastUpdated: Date.now()
        };
      },
      async (error) => {
        if (error.message.includes('token expired')) {
          await this.refreshAccessToken();
          return this.getScore(symbol);
        }
        throw error;
      }
    );
  }

  // ...rest of existing RedditSentimentProvider methods...
}

class NewsSentimentProvider extends BaseProvider implements SentimentProvider {
  readonly name = 'News';
  private apiKey: string | null = null;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheDuration = 30 * 60 * 1000; // 30 minutes

  protected get providerName(): string { return this.name; }

  async getScore(symbol: string): Promise<{ score: number; confidence: number; lastUpdated: number; }> {
    if (!this.apiKey) {
      throw new Error('NewsAPI key not configured');
    }

    return this.executeWithRecovery(
      async () => {
        const articles = await this.fetchNews(symbol);
        const { score, confidence } = this.analyzeSentiment(articles);

        return {
          score,
          confidence,
          lastUpdated: Date.now()
        };
      }
    );
  }

  // ...rest of existing NewsSentimentProvider methods...
}

export { TwitterSentimentProvider, RedditSentimentProvider, NewsSentimentProvider };