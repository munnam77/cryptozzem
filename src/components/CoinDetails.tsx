import { X, Bell, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

interface CoinDetailsProps {
  symbol: string;
  predictedGain: number;
  confidence: number;
  timeframe: string;
  onClose: () => void;
}

export function CoinDetails({ symbol, predictedGain, confidence, timeframe, onClose }: CoinDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-surface-light dark:bg-surface-dark rounded-lg p-6 max-w-2xl w-full mx-4 relative shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-4 text-text-light dark:text-text-dark">{symbol} Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={cn(
            "p-4 rounded-lg transition-colors",
            predictedGain >= 0 
              ? "bg-green-50/50 dark:bg-green-900/20" 
              : "bg-red-50/50 dark:bg-red-900/20"
          )}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Predicted Gain</h3>
            <p className={cn(
              "text-2xl font-bold",
              predictedGain >= 0 
                ? "text-green-700 dark:text-green-300" 
                : "text-red-700 dark:text-red-300"
            )}>
              {predictedGain.toFixed(2)}%
            </p>
          </div>
          
          <div className={cn(
            "p-4 rounded-lg",
            confidence >= 75 ? "bg-green-50/50 dark:bg-green-900/20" :
            confidence >= 50 ? "bg-blue-50/50 dark:bg-blue-900/20" :
            "bg-yellow-50/50 dark:bg-yellow-900/20"
          )}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Confidence Score</h3>
            <p className={cn(
              "text-2xl font-bold",
              confidence >= 75 ? "text-green-700 dark:text-green-300" :
              confidence >= 50 ? "text-blue-700 dark:text-blue-300" :
              "text-yellow-700 dark:text-yellow-300"
            )}>
              {confidence}%
            </p>
          </div>
          
          <div className="bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Timeframe</h3>
            <p className="text-2xl font-bold text-text-light dark:text-text-dark">{timeframe}</p>
          </div>
          
          <div className="bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Signal Generated</h3>
            <p className="text-2xl font-bold text-text-light dark:text-text-dark">9:00 AM JST</p>
          </div>
        </div>
        
        <div className="bg-primary/5 dark:bg-primary-dark/5 border border-primary/10 dark:border-primary-dark/10 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium text-primary dark:text-primary-dark mb-2">Analysis Summary</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Based on historical patterns and current market conditions, {symbol} shows 
            {predictedGain >= 0 ? ' strong potential for upward movement ' : ' potential downward movement '} 
            in the {timeframe} timeframe. The confidence score of {confidence}% indicates 
            {confidence >= 75 ? ' a highly reliable signal.' : 
             confidence >= 50 ? ' a moderately reliable signal.' : 
             ' a signal that should be monitored closely.'} 
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <a 
            href={`https://www.binance.com/en/trade/${symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-primary dark:text-primary-dark hover:underline"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View on Binance
          </a>
          
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium transition-colors"
            >
              Close
            </button>
            <button className="flex items-center px-4 py-2 bg-primary dark:bg-primary-dark text-white rounded-md hover:bg-primary/90 dark:hover:bg-primary-dark/90 font-medium transition-colors">
              <Bell className="w-4 h-4 mr-2" />
              Set Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}