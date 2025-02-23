import { useState, useEffect } from 'react';
import { binanceAPI } from '../lib/api/binance';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
}

export function useBinanceData(symbols: string[]) {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const fetchInitialData = async () => {
      try {
        // Fetch initial price data
        const pairs = await binanceAPI.getUSDTPairs();
        const filteredPairs = pairs.filter(pair => symbols.includes(pair));
        
        if (filteredPairs.length === 0) {
          throw new Error('No valid trading pairs found');
        }
        
        // Subscribe to real-time updates
        binanceAPI.subscribeToTickers(filteredPairs);
        
        unsubscribe = binanceAPI.subscribe((data) => {
          if (!mounted) return;
          
          if (data.s === 'ERROR') {
            setError('Connection to Binance lost. Please refresh the page.');
            return;
          }
          
          setPrices(current => {
            const index = current.findIndex(p => p.symbol === data.s);
            if (index === -1) {
              return [...current, {
                symbol: data.s,
                price: parseFloat(data.c),
                change24h: parseFloat(data.P)
              }];
            }
            
            const updated = [...current];
            updated[index] = {
              symbol: data.s,
              price: parseFloat(data.c),
              change24h: parseFloat(data.P)
            };
            return updated;
          });
        });

        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
          setLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      binanceAPI.disconnect();
    };
  }, [symbols]);

  return { prices, loading, error };
}