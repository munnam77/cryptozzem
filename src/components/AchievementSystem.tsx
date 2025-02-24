import React, { useState, useEffect } from 'react';
import { Award, Star, Target, Zap, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlockedAt?: Date;
}

export function AchievementSystem() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState<string | null>(null);

  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'award': return Award;
      case 'star': return Star;
      case 'target': return Target;
      case 'zap': return Zap;
      case 'trending-up': return TrendingUp;
      case 'users': return Users;
      case 'message-square': return MessageSquare;
      default: return Award;
    }
  };

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement API call to fetch achievements
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          name: 'Signal Master',
          description: 'Share 10 signals with high accuracy',
          icon: 'target',
          progress: 7,
          maxProgress: 10
        },
        {
          id: '2',
          name: 'Community Leader',
          description: 'Receive 100 likes on your signals',
          icon: 'users',
          progress: 65,
          maxProgress: 100
        },
        {
          id: '3',
          name: 'Analysis Guru',
          description: 'Maintain 85% prediction accuracy for a month',
          icon: 'trending-up',
          progress: 82,
          maxProgress: 85
        }
      ];
      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAchievementUnlock = (achievementId: string) => {
    setShowUnlockAnimation(achievementId);
    setTimeout(() => setShowUnlockAnimation(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <Award className="w-6 h-6 mr-2 text-primary dark:text-primary-dark" />
        Achievements
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement) => {
          const Icon = getAchievementIcon(achievement.icon);
          const isUnlocked = achievement.progress >= achievement.maxProgress;
          
          return (
            <motion.div
              key={achievement.id}
              className={cn(
                'relative rounded-lg p-6 border',
                isUnlocked
                  ? 'bg-primary/5 dark:bg-primary-dark/5 border-primary/20 dark:border-primary-dark/20'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              )}
              animate={showUnlockAnimation === achievement.id ? {
                scale: [1, 1.05, 1],
                borderColor: ['#4F46E5', '#4F46E5', 'rgba(79, 70, 229, 0.2)']
              } : {}}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Icon className={cn(
                    'w-6 h-6 mr-2',
                    isUnlocked ? 'text-primary dark:text-primary-dark' : 'text-gray-400 dark:text-gray-500'
                  )} />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {achievement.description}
                    </p>
                  </div>
                </div>
                {isUnlocked && achievement.unlockedAt && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Progress</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {achievement.progress}/{achievement.maxProgress}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={cn(
                      'rounded-full h-2 transition-all duration-500',
                      isUnlocked
                        ? 'bg-primary dark:bg-primary-dark'
                        : 'bg-gray-400 dark:bg-gray-500'
                    )}
                    style={{
                      width: `${Math.min(100, (achievement.progress / achievement.maxProgress) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}