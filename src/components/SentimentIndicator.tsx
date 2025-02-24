import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface SentimentIndicatorProps {
  value: number;  // -1 to 1
  className?: string;
}

export function SentimentIndicator({ value, className }: SentimentIndicatorProps) {
  const normalizedValue = Math.max(-1, Math.min(1, value));
  
  const { color, Icon } = useMemo(() => ({
    color: normalizedValue > 0 
      ? 'text-green-500 dark:text-green-400'
      : 'text-red-500 dark:text-red-400',
    Icon: normalizedValue > 0 ? TrendingUp : TrendingDown
  }), [normalizedValue]);

  return (
    <div 
      data-testid="sentiment-indicator"
      data-sentiment={normalizedValue}
      className={cn('flex items-center space-x-2', className)}
    >
      <Icon className={cn('h-5 w-5', color)} />
      <span className={cn('text-sm font-medium', color)}>
        {Math.abs(normalizedValue * 100).toFixed(1)}% {normalizedValue > 0 ? 'Bullish' : 'Bearish'}
      </span>
    </div>
  );
}