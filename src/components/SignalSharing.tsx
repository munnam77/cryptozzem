import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { Share2, MessageCircle, ThumbsUp, Save } from 'lucide-react';
import { cn } from '../lib/utils';

interface SharedSignal {
  id: string;
  userId: string;
  username: string;
  symbol: string;
  timeframe: string;
  prediction: {
    type: 'bullish' | 'bearish';
    targetPrice: number;
    stopLoss?: number;
    confidence: number;
  };
  analysis: {
    technical: string;
    sentiment: string;
    reasoning: string;
  };
  timestamp: Date;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export function SignalSharing() {
  const [signals, setSignals] = useState<SharedSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSignalForm, setShowNewSignalForm] = useState(false);
  const { user } = useAuth();

  const handleShareSignal = async (signalData: Omit<SharedSignal, 'id' | 'userId' | 'username' | 'timestamp' | 'likes' | 'comments'>) => {
    try {
      setIsLoading(true);
      // TODO: Implement API call to share signal
      const newSignal: SharedSignal = {
        id: Date.now().toString(),
        userId: user!.id,
        username: user!.username,
        ...signalData,
        timestamp: new Date(),
        likes: 0,
        comments: 0,
        isLiked: false,
        isSaved: false
      };
      setSignals(prev => [newSignal, ...prev]);
      setShowNewSignalForm(false);
    } catch (error) {
      console.error('Error sharing signal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeSignal = async (signalId: string) => {
    setSignals(prev => prev.map(signal => {
      if (signal.id === signalId) {
        return {
          ...signal,
          likes: signal.isLiked ? signal.likes - 1 : signal.likes + 1,
          isLiked: !signal.isLiked
        };
      }
      return signal;
    }));
    // TODO: Implement API call to update like status
  };

  const handleSaveSignal = async (signalId: string) => {
    setSignals(prev => prev.map(signal => {
      if (signal.id === signalId) {
        return {
          ...signal,
          isSaved: !signal.isSaved
        };
      }
      return signal;
    }));
    // TODO: Implement API call to update saved status
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shared Signals</h1>
        {user && (
          <button
            onClick={() => setShowNewSignalForm(true)}
            className="flex items-center px-4 py-2 bg-primary dark:bg-primary-dark text-white rounded-md
                     hover:bg-primary/90 dark:hover:bg-primary-dark/90"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Signal
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          {signals.map(signal => (
            <div
              key={signal.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{signal.username}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(signal.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <span className={cn(
                  'px-3 py-1 text-sm rounded-full',
                  signal.prediction.type === 'bullish'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                )}>
                  {signal.prediction.type === 'bullish' ? 'Bullish' : 'Bearish'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Symbol:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{signal.symbol}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Timeframe:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{signal.timeframe}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Target:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">${signal.prediction.targetPrice}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Stop Loss:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {signal.prediction.stopLoss ? `$${signal.prediction.stopLoss}` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Technical Analysis:</span>{' '}
                  {signal.analysis.technical}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Sentiment Analysis:</span>{' '}
                  {signal.analysis.sentiment}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Reasoning:</span>{' '}
                  {signal.analysis.reasoning}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleLikeSignal(signal.id)}
                    className={cn(
                      'flex items-center space-x-1 text-sm',
                      signal.isLiked ? 'text-primary dark:text-primary-dark' : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{signal.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-4 h-4" />
                    <span>{signal.comments}</span>
                  </button>
                </div>
                <button
                  onClick={() => handleSaveSignal(signal.id)}
                  className={cn(
                    'flex items-center space-x-1 text-sm',
                    signal.isSaved ? 'text-primary dark:text-primary-dark' : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  <Save className="w-4 h-4" />
                  <span>{signal.isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>
          ))}

          {signals.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No shared signals yet. Be the first to share your analysis!
            </div>
          )}
        </div>
      )}

      {showNewSignalForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Share New Signal</h2>
            {/* TODO: Implement signal sharing form */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowNewSignalForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleShareSignal({
                    symbol: 'BTCUSDT',
                    timeframe: '1h',
                    prediction: {
                      type: 'bullish',
                      targetPrice: 50000,
                      stopLoss: 48000,
                      confidence: 85
                    },
                    analysis: {
                      technical: 'Strong support at current levels with multiple bullish indicators.',
                      sentiment: 'Positive sentiment across social media and news outlets.',
                      reasoning: 'Multiple technical and fundamental factors align for a potential upward movement.'
                    }
                  });
                }}
                className="px-4 py-2 bg-primary dark:bg-primary-dark text-white rounded-md
                         hover:bg-primary/90 dark:hover:bg-primary-dark/90"
              >
                Share Signal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}