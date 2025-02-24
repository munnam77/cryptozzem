import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { DraggableGridItem } from './DraggableGridItem';
import { cn } from '../lib/utils';
import { SentimentConfigDialog } from './SentimentConfigDialog';
import { defaultGridItems } from '../lib/constants';

export interface GridItem {
  id: string;
  type: 'prediction' | 'chart' | 'clock' | 'metrics';
  size: 'small' | 'medium' | 'large';
  config?: {
    symbol?: string;
    timeframe?: string;
    indicators?: string[];
    [key: string]: any;
  };
}

interface DashboardGridProps {
  initialItems: GridItem[];
  onItemsChange?: (items: GridItem[]) => void;
  className?: string;
}

const DASHBOARD_STORAGE_KEY = 'dashboard-configuration';

export function DashboardGrid({ initialItems = defaultGridItems, onItemsChange, className }: DashboardGridProps) {
  const [gridItems, setGridItems] = useState<GridItem[]>(() => {
    const saved = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialItems;
  });

  useEffect(() => {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(gridItems));
    onItemsChange?.(gridItems);
  }, [gridItems, onItemsChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = gridItems.findIndex((item) => item.id === active.id);
      const newIndex = gridItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(gridItems, oldIndex, newIndex);
      setGridItems(newItems);
    }
  };

  const updateWidgetConfig = (id: string, config: Partial<GridItem['config']>) => {
    setGridItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, config: { ...item.config, ...config } }
          : item
      )
    );
  };

  const resetDashboard = () => {
    setGridItems(initialItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Crypto Predictions
        </h1>
        <SentimentConfigDialog />
      </div>
      <div className="flex justify-end px-4">
        <button
          onClick={resetDashboard}
          className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 
                   dark:hover:text-gray-100 transition-colors"
        >
          Reset Layout
        </button>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={gridItems.map(item => item.id)} strategy={rectSortingStrategy}>
          <div 
            data-testid="prediction-grid"
            className={cn(
              "grid gap-4 p-4",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              className
            )}>
            {gridItems.map((item) => (
              <DraggableGridItem 
                key={item.id} 
                item={item}
                onConfigChange={(config) => updateWidgetConfig(item.id, config)} 
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}