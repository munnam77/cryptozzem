import { useState, useEffect } from 'react';

interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
}

interface HistoricalPrice {
  timestamp: number;
  price: number;
}

export function useBinanceData(symbol: string, interval = '1m') {
  const [realTimePrice, setRealTimePrice] = useState<PriceData | null>(null);
  const [historicalPrices, setHistoricalPrices] = useState<HistoricalPrice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws');

    // Subscribe to price updates
    ws.onopen = () => {
      ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [`${symbol.toLowerCase()}@trade`],
        id: 1
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.e === 'trade') {
          setRealTimePrice({
            symbol: data.s,
            price: parseFloat(data.p),
            timestamp: data.T
          });

          // Add to historical prices, keeping last 24 hours of minute data
          setHistoricalPrices(prev => {
            const newData = [...prev, { timestamp: data.T, price: parseFloat(data.p) }];
            // Keep only last 1440 points (24 hours * 60 minutes)
            return newData.slice(-1440);
          });
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    };

    ws.onerror = (error) => {
      setError('WebSocket connection error');
      console.error('WebSocket error:', error);
    };

    // Fetch historical data on mount
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1440`
        );
        const data = await response.json();
        const formattedData = data.map((candle: any[]) => ({
          timestamp: candle[0],
          price: parseFloat(candle[4]) // Using close price
        }));
        setHistoricalPrices(formattedData);
        setIsLoading(false);
      } catch (e) {
        setError('Failed to fetch historical data');
        setIsLoading(false);
      }
    };

    fetchHistoricalData();

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [symbol, interval]);

  return { realTimePrice, historicalPrices, error, isLoading };
}