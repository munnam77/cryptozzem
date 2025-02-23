import { useState } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { DraggableGridItem } from './DraggableGridItem';
import { cn } from '../lib/utils';

export interface GridItem {
  id: string;
  type: 'prediction' | 'chart' | 'clock' | 'metrics';
  size: 'small' | 'medium' | 'large';
}

interface DashboardGridProps {
  items: GridItem[];
  onItemsChange?: (items: GridItem[]) => void;
  className?: string;
}

export function DashboardGrid({ items, onItemsChange, className }: DashboardGridProps) {
  const [gridItems, setGridItems] = useState(items);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = gridItems.findIndex((item) => item.id === active.id);
      const newIndex = gridItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(gridItems, oldIndex, newIndex);
      setGridItems(newItems);
      onItemsChange?.(newItems);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={gridItems.map(item => item.id)} strategy={rectSortingStrategy}>
        <div className={cn(
          "grid gap-4 p-4",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          className
        )}>
          {gridItems.map((item) => (
            <DraggableGridItem key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}