export interface PredictionResult {
  symbol: string;
  predictedGain: number;
  confidence: number;
  timeframe: string;
  timestamp: number;
}

export interface ModelFeatures {
  prices: number[];
  volumes: number[];
  technicalIndicators: {
    rsi: number[];
    macd: {
      line: number[];
      signal: number[];
      histogram: number[];
    };
    bollingerBands: {
      upper: number[];
      middle: number[];
      lower: number[];
    };
  };
}

export interface PredictionModel {
  predict(features: ModelFeatures): Promise<PredictionResult>;
  train(historicalData: ModelFeatures[], labels: number[]): Promise<void>;
  evaluate(testData: ModelFeatures[], testLabels: number[]): Promise<number>;
}