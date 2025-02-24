interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class TechnicalIndicators {
  // Simple Moving Average (SMA)
  static calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  // Exponential Moving Average (EMA)
  static calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA uses SMA as initial value
    const firstSMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(firstSMA);
    
    for (let i = period; i < prices.length; i++) {
      const currentEMA = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(currentEMA);
    }
    return ema;
  }

  // Relative Strength Index (RSI)
  static calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Calculate initial averages
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    // Calculate first RSI
    rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
    
    // Calculate subsequent RSIs
    for (let i = period; i < prices.length - 1; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
    }
    
    return rsi;
  }

  // Moving Average Convergence Divergence (MACD)
  static calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
    macd: number[];
    signal: number[];
    histogram: number[];
  } {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    
    // Calculate MACD line
    const macd: number[] = [];
    const startIndex = prices.length - fastEMA.length;
    for (let i = 0; i < fastEMA.length; i++) {
      macd.push(fastEMA[i] - slowEMA[i + startIndex]);
    }
    
    // Calculate Signal line (EMA of MACD)
    const signal = this.calculateEMA(macd, signalPeriod);
    
    // Calculate MACD histogram
    const histogram = macd.slice(-signal.length).map((value, i) => value - signal[i]);
    
    return { macd, signal, histogram };
  }

  // Bollinger Bands
  static calculateBollingerBands(prices: number[], period = 20, standardDeviations = 2): {
    middle: number[];
    upper: number[];
    lower: number[];
  } {
    const middle = this.calculateSMA(prices, period);
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      const mean = sum / period;
      
      const squaredDiffs = slice.map(price => Math.pow(price - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upper.push(middle[i - (period - 1)] + standardDeviation * standardDeviations);
      lower.push(middle[i - (period - 1)] - standardDeviation * standardDeviations);
    }
    
    return { middle, upper, lower };
  }
}