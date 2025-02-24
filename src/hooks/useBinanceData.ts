import { useState, useEffect, useRef, useMemo } from 'react';
import { WebSocketManager } from '../lib/api/websocket';
import { CacheManager } from '../lib/utils/cache';
import { useAlerts } from '../contexts/AlertContext';
import type { PriceData, HistoricalPrice, PriceAlert } from '../lib/types/price';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
const BINANCE_API_URL = 'https://api.binance.com/api/v3';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export type { HistoricalPrice };  // Re-export the type

export function useBinanceData(symbol: string, interval = '1m', isVisible = true) {
  const { alerts } = useAlerts();
  const [realTimePrice, setRealTimePrice] = useState<PriceData | null>(null);
  const [historicalPrices, setHistoricalPrices] = useState<HistoricalPrice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const wsManager = useRef<WebSocketManager | null>(null);
  const dataUpdateTimeout = useRef<NodeJS.Timeout>();

  // Memoize alerts for the current symbol
  const symbolAlerts = useMemo(() => 
    alerts.filter(alert => alert.symbol === symbol && !alert.triggered),
    [alerts, symbol]
  );

  useEffect(() => {
    const cacheManager = CacheManager.getInstance();
    const cacheKey = `${symbol}-${interval}-history`;

    // Only establish WebSocket connection if widget is visible
    if (isVisible) {
      wsManager.current = new WebSocketManager(BINANCE_WS_URL);
      wsManager.current.connect();

      const streamName = `${symbol.toLowerCase()}@trade`;
      wsManager.current.subscribe(streamName, (data) => {
        const currentPrice = parseFloat(data.p);
        const currentVolume = parseFloat(data.q || '0');
        
        // Check price alerts
        symbolAlerts.forEach(alert => {
          if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
            notifyAlert(alert, currentPrice);
          } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
            notifyAlert(alert, currentPrice);
          }
        });

        // Batch price updates to reduce re-renders
        if (dataUpdateTimeout.current) {
          clearTimeout(dataUpdateTimeout.current);
        }

        dataUpdateTimeout.current = setTimeout(() => {
          setRealTimePrice({
            symbol: data.s,
            price: currentPrice,
            volume: currentVolume,
            timestamp: data.T
          });

          setHistoricalPrices(prev => {
            const newData = [...prev, { 
              timestamp: data.T, 
              price: currentPrice,
              volume: currentVolume 
            }].slice(-1440);
            // Only cache if visible to avoid unnecessary storage
            if (isVisible) {
              cacheManager.set(cacheKey, newData, { ttl: CACHE_TTL });
            }
            return newData;
          });
        }, 1000); // Batch updates every second
      });
    }

    // Fetch historical data if not in cache or if cached data is stale
    const fetchHistoricalData = async () => {
      try {
        const cachedData = cacheManager.get<HistoricalPrice[]>(cacheKey);
        if (cachedData) {
          setHistoricalPrices(cachedData);
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=1440`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const formattedData = data.map((candle: any[]) => ({
          timestamp: candle[0],
          price: parseFloat(candle[4]), // Close price
          volume: parseFloat(candle[5])  // Volume
        }));
        
        if (isVisible) {
          cacheManager.set(cacheKey, formattedData, { ttl: CACHE_TTL });
        }
        
        setHistoricalPrices(formattedData);
        setIsLoading(false);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to fetch historical data';
        setError(errorMessage);
        setIsLoading(false);
        console.error('Historical data fetch error:', e);
      }
    };

    fetchHistoricalData();

    return () => {
      if (dataUpdateTimeout.current) {
        clearTimeout(dataUpdateTimeout.current);
      }
      if (wsManager.current) {
        const streamName = `${symbol.toLowerCase()}@trade`;
        wsManager.current.unsubscribe(streamName);
        wsManager.current.disconnect();
      }
    };
  }, [symbol, interval, isVisible, symbolAlerts]);

  const notifyAlert = (alert: PriceAlert, currentPrice: number) => {
    if (!isVisible) return; // Only show notifications for visible widgets
    
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`Price Alert: ${symbol}`, {
          body: `Price has gone ${alert.condition} $${alert.targetPrice} (Current: $${currentPrice})`,
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  };

  return { realTimePrice, historicalPrices, error, isLoading };
}