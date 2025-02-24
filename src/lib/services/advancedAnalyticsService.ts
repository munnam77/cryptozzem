import { UserRole, getRolePermissions } from '../types/roles';

interface AnalyticsMetric {
  timestamp: Date;
  value: number;
  confidence: number;
}

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  timeframe: string;
}

interface MarketAnalysis {
  sentiment: {
    overall: number;
    social: number;
    news: number;
    technical: number;
  };
  volume: {
    current: number;
    change24h: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  priceAction: {
    support: number;
    resistance: number;
    trend: string;
    momentum: number;
  };
  correlations: {
    btc: number;
    eth: number;
    market: number;
  };
}

export class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;

  static getInstance(): AdvancedAnalyticsService {
    if (!this.instance) {
      this.instance = new AdvancedAnalyticsService();
    }
    return this.instance;
  }

  async getCustomIndicators(symbol: string, timeframe: string, role: UserRole): Promise<TechnicalIndicator[]> {
    const permissions = getRolePermissions(role);
    if (!permissions.canAccessPremiumFeatures) {
      throw new Error('Premium features required for custom indicators');
    }

    const response = await fetch(`/api/analytics/indicators/${symbol}?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error('Failed to fetch custom indicators');
    }
    return response.json();
  }

  async getMarketAnalysis(symbol: string): Promise<MarketAnalysis> {
    const response = await fetch(`/api/analytics/market/${symbol}`);
    if (!response.ok) {
      throw new Error('Failed to fetch market analysis');
    }
    return response.json();
  }

  async getPredictionAccuracy(symbol: string, timeframe: string): Promise<AnalyticsMetric[]> {
    const response = await fetch(`/api/analytics/accuracy/${symbol}?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error('Failed to fetch prediction accuracy');
    }
    return response.json();
  }

  async getCorrelationMatrix(symbols: string[]): Promise<Record<string, Record<string, number>>> {
    const response = await fetch('/api/analytics/correlations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols })
    });
    if (!response.ok) {
      throw new Error('Failed to fetch correlation matrix');
    }
    return response.json();
  }

  async generateTradingReport(symbol: string, startDate: Date, endDate: Date): Promise<Blob> {
    const response = await fetch('/api/analytics/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, startDate, endDate })
    });
    if (!response.ok) {
      throw new Error('Failed to generate trading report');
    }
    return response.blob();
  }

  async getVolumeProfile(symbol: string, timeframe: string): Promise<{
    price: number;
    volume: number;
    valueArea: boolean;
  }[]> {
    const response = await fetch(`/api/analytics/volume-profile/${symbol}?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error('Failed to fetch volume profile');
    }
    return response.json();
  }

  async getAdvancedPatterns(symbol: string): Promise<{
    pattern: string;
    probability: number;
    priceTarget: number;
    timeframe: string;
  }[]> {
    const response = await fetch(`/api/analytics/patterns/${symbol}`);
    if (!response.ok) {
      throw new Error('Failed to fetch advanced patterns');
    }
    return response.json();
  }
}