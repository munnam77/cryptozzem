import { useState } from 'react';
import { ArrowUpRight, TrendingUp, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { CoinDetails } from './CoinDetails';

interface CoinPredictionProps {
  symbol: string;
  predictedGain: number;
  confidence: number;
  timeframe: string;
}

export function CoinPrediction({ symbol, predictedGain, confidence, timeframe }: CoinPredictionProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">{symbol}</h3>
            <span className={cn(
              "ml-2 text-sm px-2 py-0.5 rounded-full font-medium flex items-center",
              predictedGain >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            )}>
              {predictedGain >= 0 && <ArrowUpRight className="w-4 h-4 mr-1" />}
              {predictedGain.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
            <Clock className="w-4 h-4 mr-1" />
            {timeframe}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-blue-50 px-3 py-1 rounded">
            <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
            <div className="text-sm font-medium text-blue-800">
              Confidence: {confidence}%
            </div>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Details
          </button>
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