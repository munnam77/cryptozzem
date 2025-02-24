import React from 'react';
import { XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <div 
      data-testid="error-message"
      className={cn(
        "flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg",
        className
      )}
    >
      <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
      <span className="text-sm text-red-600 dark:text-red-300">{message}</span>
    </div>
  );
}