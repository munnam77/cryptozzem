import { WebSocket } from 'ws';

interface BinanceStreamData {
  s: string;  // Symbol
  c: string;  // Close price
  P: string;  // Price change percent
}

interface KlineData {
  symbol: string;
  interval: string;
  startTime: number;
  endTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

class BinanceAPI {
  private static baseURL = 'https://api.binance.com/api/v3';
  private static wsBaseURL = 'wss://stream.binance.com:9443/ws';
  private ws: WebSocket | null = null;
  private subscribers: Set<(data: BinanceStreamData) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  async getUSDTPairs(): Promise<string[]> {
    try {
      const response = await fetch(`${BinanceAPI.baseURL}/exchangeInfo`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.symbols
        .filter((symbol: any) => symbol.quoteAsset === 'USDT' && symbol.status === 'TRADING')
        .map((symbol: any) => symbol.symbol);
    } catch (error) {
      console.error('Error fetching USDT pairs:', error);
      throw new Error('Failed to fetch trading pairs');
    }
  }

  async getKlines(symbol: string, interval: string, limit = 100): Promise<KlineData[]> {
    try {
      const response = await fetch(
        `${BinanceAPI.baseURL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.map((kline: any[]) => ({
        symbol,
        interval,
        startTime: kline[0],
        endTime: kline[6],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
      }));
    } catch (error) {
      console.error(`Error fetching klines for ${symbol}:`, error);
      throw new Error(`Failed to fetch kline data for ${symbol}`);
    }
  }

  subscribeToTickers(symbols: string[]): void {
    if (this.ws) {
      this.ws.close();
    }

    const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
    this.ws = new WebSocket(`${BinanceAPI.wsBaseURL}/${streams}`);

    this.ws.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        this.subscribers.forEach(callback => callback(data));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.handleReconnect(symbols);
    };
  }

  private handleReconnect(symbols: string[]): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.subscribeToTickers(symbols), delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.subscribers.forEach(callback => 
        callback({ s: 'ERROR', c: '0', P: '0' })
      );
    }
  }

  subscribe(callback: (data: BinanceStreamData) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
    this.reconnectAttempts = 0;
  }
}

export const binanceAPI = new BinanceAPI();