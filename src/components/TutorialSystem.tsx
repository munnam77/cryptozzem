import React, { useState, useEffect } from 'react';
import { TradingTip, EducationalResourceManager } from '../lib/services/educationalResourceManager';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

interface TutorialStep {
  title: string;
  content: React.ReactNode;
  placement: 'top' | 'bottom' | 'left' | 'right';
  targetElement: string;
}

export function TutorialSystem() {
  const [activeTutorial, setActiveTutorial] = useState<TutorialStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tips, setTips] = useState<TradingTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const educationalManager = EducationalResourceManager.getInstance();

  useEffect(() => {
    loadTradingTips();
  }, []);

  const loadTradingTips = async () => {
    try {
      const fetchedTips = await educationalManager.getTradingTips();
      setTips(fetchedTips);
    } catch (error) {
      console.error('Failed to load trading tips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTutorial = (tutorialSteps: TutorialStep[]) => {
    setActiveTutorial(tutorialSteps);
    setCurrentStep(0);
    setIsVisible(true);
  };

  const nextStep = async () => {
    if (currentStep < activeTutorial.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const endTutorial = async () => {
    setIsVisible(false);
    setCurrentStep(0);
    if (user) {
      try {
        await educationalManager.markTipAsRead(user.id, tips[currentStep].id);
      } catch (error) {
        console.error('Failed to mark tutorial as completed:', error);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isVisible) {
    return null;
  }

  const currentTutorialStep = activeTutorial[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {currentTutorialStep.title}
          </h3>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {currentTutorialStep.content}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={previousStep}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300"
          >
            Previous
          </button>
          <button
            onClick={nextStep}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {currentStep === activeTutorial.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="flex space-x-2">
            {activeTutorial.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={endTutorial}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <span className="sr-only">Close tutorial</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}