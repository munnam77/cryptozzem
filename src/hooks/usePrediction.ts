import { useState, useEffect } from 'react';
import { PredictionManager } from '../lib/predictions/predictionManager';
import { PredictionResult } from '../lib/predictions/types';
import { useBinanceData } from './useBinanceData';

interface UsePredictionOptions {
  symbol: string;
  timeframe: string;
  isVisible?: boolean;
}

interface PredictionState {
  prediction: PredictionResult | null;
  isLoading: boolean;
  error: string | null;
  modelStatus: {
    isInitialized: boolean;
    lastTrainingDate?: number;
    error?: string;
  };
}

export function usePrediction({ symbol, timeframe, isVisible = true }: UsePredictionOptions): PredictionState {
  const [state, setState] = useState<PredictionState>({
    prediction: null,
    isLoading: true,
    error: null,
    modelStatus: { isInitialized: false }
  });

  const { historicalPrices, error: dataError } = useBinanceData(symbol, timeframe, isVisible);
  const predictionManager = PredictionManager.getInstance();

  // Update model status when timeframe changes
  useEffect(() => {
    const modelStatus = predictionManager.getModelStatus(timeframe);
    setState(prev => ({ ...prev, modelStatus }));
  }, [timeframe]);

  // Fetch prediction when data changes
  useEffect(() => {
    if (!isVisible || !historicalPrices.length) return;

    const getPrediction = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const prices = historicalPrices.map(p => p.price);
        const volumes = historicalPrices.map(p => p.volume);
        
        const prediction = await predictionManager.getPrediction(
          symbol,
          timeframe,
          prices,
          volumes
        );

        setState(prev => ({
          ...prev,
          prediction,
          isLoading: false,
          error: null,
          modelStatus: predictionManager.getModelStatus(timeframe)
        }));
      } catch (e) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: e instanceof Error ? e.message : 'Failed to get prediction',
          modelStatus: predictionManager.getModelStatus(timeframe)
        }));
      }
    };

    getPrediction();
  }, [symbol, timeframe, isVisible, historicalPrices, predictionManager]);

  // Handle data fetching errors
  useEffect(() => {
    if (dataError) {
      setState(prev => ({
        ...prev,
        error: dataError,
        isLoading: false
      }));
    }
  }, [dataError]);

  return state;
}