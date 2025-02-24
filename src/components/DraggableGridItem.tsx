import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import type { GridItem } from './DashboardGrid';
import { cn } from '../lib/utils';
import { JSTClock } from './JSTClock';
import { PriceChart } from './PriceChart';
import { CoinPrediction } from './CoinPrediction';
import { ErrorBoundary } from './ErrorBoundary';

interface DraggableGridItemProps {
  item: GridItem;
  onConfigChange?: (config: Partial<GridItem['config']>) => void;
}

export function DraggableGridItem({ item, onConfigChange }: DraggableGridItemProps) {
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });
  const [showSettings, setShowSettings] = useState(false);
  const previousInView = useRef(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  // Combine refs
  const setRefs = (element: HTMLDivElement | null) => {
    setNodeRef(element);
    inViewRef(element);
  };

  useEffect(() => {
    // Only trigger updates when visibility actually changes
    if (previousInView.current !== inView) {
      previousInView.current = inView;
      onConfigChange?.({ isVisible: inView });
    }
  }, [inView, onConfigChange]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTimeframeChange = (timeframe: string) => {
    onConfigChange?.({ timeframe });
    setShowSettings(false);
  };

  const handleSymbolChange = (symbol: string) => {
    onConfigChange?.({ symbol });
    setShowSettings(false);
  };

  const renderSettings = () => {
    if (!showSettings) return null;

    switch (item.type) {
      case 'chart':
        return (
          <div className="absolute top-12 right-2 z-20 bg-surface-light dark:bg-surface-dark 
                        shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timeframe
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {['1m', '5m', '15m', '30m', '1h', '4h', '1d'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => handleTimeframeChange(tf)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-md transition-colors",
                        item.config?.timeframe === tf
                          ? "bg-primary dark:bg-primary-dark text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Symbol
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'].map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => handleSymbolChange(symbol)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-md transition-colors",
                        item.config?.symbol === symbol
                          ? "bg-primary dark:bg-primary-dark text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      // Add more cases for other widget types
      default:
        return null;
    }
  };

  const renderContent = () => {
    // Only render content if the widget is in view or was previously in view
    if (!inView && !previousInView.current) {
      return <div className="h-[200px] flex items-center justify-center">Loading...</div>;
    }

    switch (item.type) {
      case 'prediction':
        return (
          <ErrorBoundary>
            <CoinPrediction
              symbol={item.config?.symbol || "BTCUSDT"}
              predictedGain={2.5}
              confidence={85}
              timeframe={item.config?.timeframe || "4h"}
              lastPrice={42000}
              volume24h={1500000000}
            />
          </ErrorBoundary>
        );
      case 'chart':
        return (
          <ErrorBoundary>
            <PriceChart
              symbol={item.config?.symbol || "BTCUSDT"}
              timeframe={item.config?.timeframe || "1m"}
              className="h-[400px]"
              isVisible={inView}
            />
          </ErrorBoundary>
        );
      case 'clock':
        return (
          <ErrorBoundary>
            <JSTClock />
          </ErrorBoundary>
        );
      case 'metrics':
        return (
          <ErrorBoundary>
            <div className="p-4 text-text-light dark:text-text-dark">
              Market Metrics Content
            </div>
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setRefs}
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
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
        >
          <Settings className="w-4 h-4 text-gray-400" />
        </button>
        <div
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      {renderSettings()}
      {renderContent()}
    </div>
  );
}