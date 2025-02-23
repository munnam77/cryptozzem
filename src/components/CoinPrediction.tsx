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
            <span className={cn(
              "ml-2 text-sm px-2 py-0.5 rounded-full font-medium flex items-center",
              predictedGain >= 0 
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" 
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
            )}>
              {predictedGain >= 0 
                ? <ArrowUpRight className="w-4 h-4 mr-1" /> 
                : <ArrowDownRight className="w-4 h-4 mr-1" />}
              {predictedGain.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded">
            <Clock className="w-4 h-4 mr-1" />
            {timeframe}
          </div>
        </div>
        
        <div className="space-y-3">
          {lastPrice && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Last Price: ${lastPrice.toFixed(4)}
            </div>
          )}
          
          {volume24h && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              24h Volume: ${(volume24h / 1000000).toFixed(2)}M
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center px-3 py-1 rounded transition-colors",
              confidence >= 75 ? "bg-green-50 dark:bg-green-900/20" :
              confidence >= 50 ? "bg-blue-50 dark:bg-blue-900/20" :
              "bg-yellow-50 dark:bg-yellow-900/20"
            )}>
              <TrendingUp className={cn(
                "w-4 h-4 mr-1",
                confidence >= 75 ? "text-green-600 dark:text-green-400" :
                confidence >= 50 ? "text-blue-600 dark:text-blue-400" :
                "text-yellow-600 dark:text-yellow-400"
              )} />
              <div className={cn(
                "text-sm font-medium",
                confidence >= 75 ? "text-green-800 dark:text-green-300" :
                confidence >= 50 ? "text-blue-800 dark:text-blue-300" :
                "text-yellow-800 dark:text-yellow-300"
              )}>
                Confidence: {confidence}%
              </div>
            </div>
            <button
              onClick={() => setShowDetails(true)}
              className={cn(
                "text-sm font-medium px-3 py-1 rounded-full transition-colors",
                "bg-primary/10 dark:bg-primary-dark/10",
                "text-primary dark:text-primary hover:bg-primary/20 dark:hover:bg-primary-dark/20"
              )}
            >
              View Details
            </button>
          </div>
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