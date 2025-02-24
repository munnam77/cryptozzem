import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, MessageSquare, Star } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '../lib/utils';

interface LeaderboardUser {
  id: string;
  username: string;
  rank: number;
  score: number;
  accuracy: number;
  contributions: number;
  signalQuality: number;
}

enum SortField {
  Rank = 'rank',
  Accuracy = 'accuracy',
  Contributions = 'contributions',
  SignalQuality = 'signalQuality'
}

export function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>(SortField.Rank);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'allTime'>('monthly');

  const timeframes = [
    { id: 'weekly', label: 'This Week' },
    { id: 'monthly', label: 'This Month' },
    { id: 'allTime', label: 'All Time' }
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe, sortField]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement API call to fetch leaderboard data
      // Mock data for now
      const mockUsers: LeaderboardUser[] = Array.from({ length: 10 }, (_, i) => ({
        id: `user${i + 1}`,
        username: `Trader${i + 1}`,
        rank: i + 1,
        score: Math.round(Math.random() * 1000),
        accuracy: Math.round(Math.random() * 100),
        contributions: Math.round(Math.random() * 50),
        signalQuality: Math.round(Math.random() * 100)
      }));
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Award className="w-8 h-8 mr-2 text-primary dark:text-primary-dark" />
          Top Traders
        </h1>

        <div className="flex space-x-2">
          {timeframes.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTimeframe(id as typeof timeframe)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md',
                timeframe === id
                  ? 'bg-primary dark:bg-primary-dark text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 font-medium">
            <div className="col-span-2">Trader</div>
            <button
              onClick={() => setSortField(SortField.Accuracy)}
              className={cn(
                'flex items-center space-x-1',
                sortField === SortField.Accuracy && 'text-primary dark:text-primary-dark'
              )}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Accuracy</span>
            </button>
            <button
              onClick={() => setSortField(SortField.Contributions)}
              className={cn(
                'flex items-center space-x-1',
                sortField === SortField.Contributions && 'text-primary dark:text-primary-dark'
              )}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Posts</span>
            </button>
            <button
              onClick={() => setSortField(SortField.SignalQuality)}
              className={cn(
                'flex items-center space-x-1',
                sortField === SortField.SignalQuality && 'text-primary dark:text-primary-dark'
              )}
            >
              <Star className="w-4 h-4" />
              <span>Quality</span>
            </button>
            <div>Score</div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="col-span-2 flex items-center space-x-3">
                  <span className={cn('font-medium', getRankColor(user.rank))}>
                    #{user.rank}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {user.username}
                  </span>
                </div>
                <div>{user.accuracy}%</div>
                <div>{user.contributions}</div>
                <div>{user.signalQuality}%</div>
                <div className="font-medium text-primary dark:text-primary-dark">
                  {user.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}