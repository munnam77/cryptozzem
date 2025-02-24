import { ConfigManager } from './config';
import { ProviderHealthMonitor } from './providerHealth';
import { withRetry } from './errorRecovery';

export interface SentimentSource {
  name: string;
  weight: number;
  lastUpdated: number;
  provider: string;
  confidence: number;
}

export interface SentimentScore {
  symbol: string;
  score: number;
  confidence: number;
  sources: SentimentSource[];
  timestamp: number;
}

export interface SentimentProvider {
  name: string;
  getScore(symbol: string): Promise<{
    score: number;
    confidence: number;
    lastUpdated: number;
  }>;
  initialize(apiKey: string): Promise<void>;
}

abstract class BaseSentimentProvider implements SentimentProvider {
  abstract name: string;
  protected apiKey: string | null = null;

  async initialize(apiKey: string): Promise<void> {
    this.apiKey = apiKey;
  }

  async getScore(symbol: string): Promise<{ score: number; confidence: number; lastUpdated: number }> {
    return withRetry(this.name, () => this.fetchScore(symbol));
  }

  protected abstract fetchScore(symbol: string): Promise<{
    score: number;
    confidence: number;
    lastUpdated: number;
  }>;
}

class TwitterSentimentProvider extends BaseSentimentProvider {
  readonly name = 'Twitter';

  protected async fetchScore(symbol: string) {
    if (!this.apiKey) throw new Error('Twitter API key not configured');

    const response = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(symbol)}&max_results=100`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    return this.analyzeSentiment(data.data || []);
  }

  private analyzeSentiment(tweets: any[]): { score: number; confidence: number; lastUpdated: number } {
    if (!tweets.length) {
      return { score: 0, confidence: 0, lastUpdated: Date.now() };
    }

    let totalScore = 0;
    let totalWeight = 0;

    tweets.forEach(tweet => {
      const metrics = tweet.public_metrics || {};
      const weight = Math.log1p(metrics.like_count + metrics.retweet_count);
      const score = this.analyzeText(tweet.text);
      totalScore += score * weight;
      totalWeight += weight;
    });

    return {
      score: totalWeight > 0 ? totalScore / totalWeight : 0,
      confidence: Math.min(tweets.length / 100, 1) * 0.9,
      lastUpdated: Date.now()
    };
  }

  private analyzeText(text: string): number {
    // Simple sentiment analysis implementation
    const positiveWords = ['bullish', 'buy', 'long', 'up', 'good', 'great', 'moon'];
    const negativeWords = ['bearish', 'sell', 'short', 'down', 'bad', 'crash', 'dump'];
    
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score++;
      if (negativeWords.includes(word)) score--;
    });
    
    return Math.max(Math.min(score / 5, 1), -1);
  }
}

class RedditSentimentProvider extends BaseSentimentProvider {
  readonly name = 'Reddit';
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private subreddits = ['cryptocurrency', 'cryptomarkets', 'bitcoin'];

  async initialize(apiKey: string): Promise<void> {
    const [clientId, clientSecret] = apiKey.split(':');
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    await this.getAccessToken();
  }

  private async getAccessToken(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return;
    }

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error('Failed to get Reddit access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
  }

  protected async fetchScore(symbol: string) {
    await this.getAccessToken();
    const posts = await this.fetchPosts(symbol);
    return this.analyzeSentiment(posts);
  }

  private async fetchPosts(symbol: string): Promise<any[]> {
    if (!this.accessToken) throw new Error('Reddit API not initialized');

    const posts: any[] = [];
    for (const subreddit of this.subreddits) {
      const response = await fetch(
        `https://oauth.reddit.com/r/${subreddit}/search.json?q=${symbol}&sort=new&limit=25`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': 'CryptoSignalZzem/1.0.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch from r/${subreddit}`);
      }

      const data = await response.json();
      posts.push(...data.data.children.map((child: any) => child.data));
    }

    return posts;
  }

  private analyzeSentiment(posts: any[]): { score: number; confidence: number; lastUpdated: number } {
    if (!posts.length) {
      return { score: 0, confidence: 0, lastUpdated: Date.now() };
    }

    const keywords = {
      positive: ['bullish', 'buy', 'long', 'moon', 'rocket', 'up'],
      negative: ['bearish', 'sell', 'short', 'dump', 'crash', 'down']
    };

    let totalScore = 0;
    let totalWeight = 0;
    let matches = 0;

    const sentimentWeights = {
      title: 1.5,
      text: 1.0,
      score: 0.5
    };

    posts.forEach(post => {
      const titleScore = this.analyzeText(post.title, keywords) * sentimentWeights.title;
      const textScore = this.analyzeText(post.selftext || '', keywords) * sentimentWeights.text;
      const upvoteScore = Math.sign(post.score) * Math.log1p(Math.abs(post.score)) * sentimentWeights.score;

      totalScore += titleScore + textScore + upvoteScore;
      totalWeight += sentimentWeights.title + sentimentWeights.text + sentimentWeights.score;
      matches += (titleScore !== 0 ? 1 : 0) + (textScore !== 0 ? 1 : 0);
    });

    const normalizedScore = totalScore / totalWeight;
    const confidence = Math.min(matches / (posts.length * 2), 1) * 0.85;

    return {
      score: Math.max(Math.min(normalizedScore, 1), -1),
      confidence,
      lastUpdated: Date.now()
    };
  }

  private analyzeText(text: string, keywords: { positive: string[]; negative: string[] }): number {
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    
    words.forEach(word => {
      if (keywords.positive.includes(word)) score++;
      if (keywords.negative.includes(word)) score--;
    });
    
    return score === 0 ? 0 : Math.sign(score) * Math.min(Math.abs(score) / 3, 1);
  }
}

class NewsSentimentProvider extends BaseSentimentProvider {
  readonly name = 'News';

  protected async fetchScore(symbol: string) {
    if (!this.apiKey) throw new Error('News API key not configured');

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${symbol}&sortBy=publishedAt&pageSize=25`,
      {
        headers: {
          'X-Api-Key': this.apiKey
        }
      }
    );

    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`);
    }

    const data = await response.json();
    return this.analyzeSentiment(data.articles || []);
  }

  private analyzeSentiment(articles: any[]): { score: number; confidence: number; lastUpdated: number } {
    if (!articles.length) {
      return { score: 0, confidence: 0, lastUpdated: Date.now() };
    }

    let totalScore = 0;
    let totalWeight = 0;

    articles.forEach(article => {
      const age = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
      const weight = Math.exp(-age / 24); // Exponential decay based on article age
      const score = this.analyzeText(article.title + ' ' + (article.description || ''));
      totalScore += score * weight;
      totalWeight += weight;
    });

    return {
      score: totalWeight > 0 ? totalScore / totalWeight : 0,
      confidence: Math.min(articles.length / 50, 1) * 0.8,
      lastUpdated: Date.now()
    };
  }

  private analyzeText(text: string): number {
    const positiveWords = ['bullish', 'surge', 'rally', 'gain', 'rise', 'growth', 'positive'];
    const negativeWords = ['bearish', 'plunge', 'crash', 'drop', 'fall', 'decline', 'negative'];
    
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score++;
      if (negativeWords.includes(word)) score--;
    });
    
    return Math.max(Math.min(score / 4, 1), -1);
  }
}

export class SentimentAnalyzer {
  private static instance: SentimentAnalyzer;
  private providers: { [key: string]: SentimentProvider } = {};
  private configManager: ConfigManager;
  private healthMonitor: ProviderHealthMonitor;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.healthMonitor = ProviderHealthMonitor.getInstance();
    this.initializeProviders();
  }

  static getInstance(): SentimentAnalyzer {
    if (!SentimentAnalyzer.instance) {
      SentimentAnalyzer.instance = new SentimentAnalyzer();
    }
    return SentimentAnalyzer.instance;
  }

  private initializeProviders() {
    this.providers = {
      Twitter: new TwitterSentimentProvider(),
      Reddit: new RedditSentimentProvider(),
      News: new NewsSentimentProvider()
    };

    // Initialize enabled providers with their API keys
    const config = this.configManager.getConfig();
    Object.entries(config.providers).forEach(([name, settings]) => {
      if (settings.enabled && settings.apiKeys.length > 0) {
        this.providers[name].initialize(settings.apiKeys[0]);
      }
    });
  }

  async getSentiment(symbol: string): Promise<SentimentScore> {
    const config = this.configManager.getConfig();
    const enabledProviders = Object.entries(config.providers)
      .filter(([_, settings]) => settings.enabled)
      .map(([name]) => name);

    const sources: SentimentSource[] = [];
    let totalScore = 0;
    let totalWeight = 0;
    const timestamp = Date.now();

    for (const providerName of enabledProviders) {
      try {
        const result = await withRetry(providerName, async () => {
          const provider = this.providers[providerName];
          return provider.getScore(symbol);
        });

        const weight = config.providers[providerName].weight;
        sources.push({
          name: providerName,
          weight,
          lastUpdated: result.lastUpdated,
          provider: providerName,
          confidence: result.confidence
        });

        totalScore += result.score * weight * result.confidence;
        totalWeight += weight * result.confidence;

        this.healthMonitor.recordSuccess(providerName, timestamp);
      } catch (error) {
        this.healthMonitor.recordError(providerName, error as Error);
      }
    }

    if (totalWeight === 0) {
      throw new Error('No sentiment data available');
    }

    return {
      symbol,
      score: totalScore / totalWeight,
      confidence: totalWeight / Object.values(config.providers).reduce((sum, p) => sum + p.weight, 0),
      sources,
      timestamp
    };
  }
}