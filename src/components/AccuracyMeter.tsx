import { PieChart } from 'lucide-react';
import { cn } from '../lib/utils';

interface AccuracyMeterProps {
  timeframe: string;
  accuracy: number;
}

export function AccuracyMeter({ timeframe, accuracy }: AccuracyMeterProps) {
  const getAccuracyColor = (value: number) => {
    if (value >= 75) return 'bg-green-100 text-green-800';
    if (value >= 60) return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <PieChart className="w-5 h-5 text-blue-600" />
          <span className="ml-2 font-medium text-gray-600">{timeframe}</span>
        </div>
      </div>
      <div className="mt-2">
        <div className="flex items-baseline">
          <span className={cn(
            "text-2xl font-bold px-2 py-1 rounded",
            getAccuracyColor(accuracy)
          )}>
            {accuracy}%
          </span>
          <span className="ml-2 text-sm text-gray-500">accuracy</span>
        </div>
        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              getAccuracyColor(accuracy)
            )}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>
    </div>
  );
}