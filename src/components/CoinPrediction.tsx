import { useState } from 'react';
import { ArrowUpRight, TrendingUp, Clock, ArrowDownRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { CoinDetails } from './CoinDetails';

interface CoinPredictionProps {
  symbol: string;
  predictedGain: number;
  confidence: number;
  timeframe: string;
  volume24h?: number;
  lastPrice?: number;
}

export function CoinPrediction({ 
  symbol, 
  predictedGain, 
  confidence, 
  timeframe,
  volume24h,
  lastPrice 
}: CoinPredictionProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div 
        data-testid="prediction-card"
        className={cn(
          "bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-4 transition-all duration-200",
          "border border-gray-200 dark:border-gray-700",
          "hover:shadow-lg hover:scale-[1.02]",
          isHovered ? "ring-2 ring-primary dark:ring-primary-dark" : ""
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">{symbol}</h3>
            <span data-testid="timeframe" className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4 inline-block mr-1" />
              {timeframe}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {predictedGain >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-500 mr-1" />
              )}
              <span 
                data-testid="prediction-value"
                className={cn(
                  "text-xl font-bold",
                  predictedGain >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {Math.abs(predictedGain).toFixed(2)}%
              </span>
            </div>

            <div 
              data-testid="confidence-meter"
              data-confidence={confidence / 100}
              className="flex items-center"
            >
              <TrendingUp className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {confidence}% confidence
              </span>
            </div>
          </div>

          {lastPrice && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last Price: ${lastPrice.toLocaleString()}
            </div>
          )}

          {volume24h && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              24h Volume: ${(volume24h / 1000000).toFixed(2)}M
            </div>
          )}
        </div>
      </div>

      {showDetails && (
        <CoinDetails
          symbol={symbol}
          predictedGain={predictedGain}
          confidence={confidence}
          timeframe={timeframe}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}