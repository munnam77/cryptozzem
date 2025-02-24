export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  volume?: number;
}

export interface HistoricalPrice {
  timestamp: number;
  price: number;
  volume: number;
}

export interface PriceAlert {
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  triggered?: boolean;
}