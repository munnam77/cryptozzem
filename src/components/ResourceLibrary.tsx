import React, { useState, useEffect } from 'react';
import { TradingTip, EducationalResourceManager } from '../lib/services/educationalResourceManager';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

interface ResourceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const categories: ResourceCategory[] = [
  {
    id: 'technical',
    name: 'Technical Analysis',
    description: 'Learn about charts, indicators, and technical patterns',
    icon: 'chart-line'
  },
  {
    id: 'fundamental',
    name: 'Fundamental Analysis',
    description: 'Understand market fundamentals and valuations',
    icon: 'building-columns'
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Master market psychology and sentiment indicators',
    icon: 'user-group'
  },
  {
    id: 'risk',
    name: 'Risk Management',
    description: 'Learn position sizing and risk control strategies',
    icon: 'shield-check'
  }
];

export function ResourceLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [resources, setResources] = useState<TradingTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readResources, setReadResources] = useState<string[]>([]);
  const { user } = useAuth();
  
  const educationalManager = EducationalResourceManager.getInstance();

  useEffect(() => {
    loadResources();
    if (user) {
      loadUserProgress();
    }
  }, [selectedCategory, user]);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const tips = await educationalManager.getTradingTips(selectedCategory);
      setResources(tips);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const progress = await educationalManager.getUserProgress(user!.id);
      setReadResources(progress);
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  };

  const markResourceAsRead = async (resourceId: string) => {
    try {
      await educationalManager.markTipAsRead(user!.id, resourceId);
      setReadResources(prev => [...prev, resourceId]);
    } catch (error) {
      console.error('Failed to mark resource as read:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Resource Library
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`p-6 rounded-lg shadow-sm transition-all ${
              selectedCategory === category.id
                ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-500'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <i className={`fas fa-${category.icon} text-2xl mb-3 text-blue-500`}></i>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {category.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {category.description}
            </p>
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 text-xs rounded ${
                  resource.level === 'beginner' ? 'bg-green-100 text-green-800' :
                  resource.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {resource.level}
                </span>
                {readResources.includes(resource.id) && (
                  <span className="text-green-500">
                    <i className="fas fa-check-circle"></i>
                  </span>
                )}
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {resource.title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {resource.content}
              </p>
              <button
                onClick={() => markResourceAsRead(resource.id)}
                disabled={readResources.includes(resource.id)}
                className={`w-full py-2 px-4 rounded ${
                  readResources.includes(resource.id)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {readResources.includes(resource.id) ? 'Completed' : 'Mark as Read'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}