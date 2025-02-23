import React from 'react';
import { X } from 'lucide-react';

interface CoinDetailsProps {
  symbol: string;
  predictedGain: number;
  confidence: number;
  timeframe: string;
  onClose: () => void;
}

export function CoinDetails({ symbol, predictedGain, confidence, timeframe, onClose }: CoinDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-4">{symbol} Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Predicted Gain</h3>
            <p className="text-2xl font-bold text-gray-900">{predictedGain.toFixed(2)}%</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Confidence Score</h3>
            <p className="text-2xl font-bold text-gray-900">{confidence}%</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Timeframe</h3>
            <p className="text-2xl font-bold text-gray-900">{timeframe}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Signal Generated</h3>
            <p className="text-2xl font-bold text-gray-900">9:00 AM JST</p>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Analysis Summary</h3>
          <p className="text-gray-700">
            Based on historical patterns and current market conditions, {symbol} shows strong potential
            for upward movement in the {timeframe} timeframe. The confidence score of {confidence}%
            indicates a reliable signal.
          </p>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
            Set Alert
          </button>
        </div>
      </div>
    </div>
  );
}