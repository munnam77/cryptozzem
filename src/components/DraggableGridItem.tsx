import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings } from 'lucide-react';
import { useState } from 'react';
import type { GridItem } from './DashboardGrid';
import { cn } from '../lib/utils';
import { JSTClock } from './JSTClock';
import { PriceChart } from './PriceChart';
import { CoinPrediction } from './CoinPrediction';

const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'] as const;
type Timeframe = typeof timeframes[number];

interface DraggableGridItemProps {
  item: GridItem;
}

export function DraggableGridItem({ item }: DraggableGridItemProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1m');
  const [showSettings, setShowSettings] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderTimeframeSelector = () => (
    <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
      >
        <Settings className="w-4 h-4 text-gray-400" />
      </button>
      {showSettings && (
        <div className="flex gap-1 bg-surface-light dark:bg-surface-dark p-1 rounded-md shadow-lg">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setSelectedTimeframe(tf);
                setShowSettings(false);
              }}
              className={cn(
                "px-2 py-1 text-xs rounded-md transition-colors",
                tf === selectedTimeframe
                  ? "bg-primary dark:bg-primary-dark text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (item.type) {
      case 'prediction':
        return (
          <CoinPrediction
            symbol="BTCUSDT"
            predictedGain={2.5}
            confidence={85}
            timeframe="4h"
            lastPrice={42000}
            volume24h={1500000000}
          />
        );
      case 'chart':
        return (
          <>
            {renderTimeframeSelector()}
            <PriceChart
              symbol="BTCUSDT"
              timeframe={selectedTimeframe}
              className="h-[400px] pt-8"
            />
          </>
        );
      case 'clock':
        return <JSTClock />;
      case 'metrics':
        return <div className="p-4 text-text-light dark:text-text-dark">Market Metrics Content</div>;
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative bg-surface-light dark:bg-surface-dark rounded-lg shadow-md",
        "transition-shadow duration-200",
        isDragging ? "shadow-xl ring-2 ring-primary dark:ring-primary-dark z-10" : "",
        item.size === 'large' ? "col-span-2 row-span-2" :
        item.size === 'medium' ? "col-span-2" :
        "col-span-1"
      )}
    >
      <div
        {...attributes}
        {...listeners}