import { ThemeProvider } from './contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';
import { DashboardGrid, GridItem } from './components/DashboardGrid';
import { useState } from 'react';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button 
      onClick={toggleTheme}
      className="fixed top-4 right-4 p-2 rounded-full bg-surface-light dark:bg-surface-dark"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

const defaultGridItems: GridItem[] = [
  { id: 'clock', type: 'clock', size: 'small' },
  { id: 'btc-prediction', type: 'prediction', size: 'medium' },
  { id: 'eth-prediction', type: 'prediction', size: 'medium' },
  { id: 'price-chart', type: 'chart', size: 'large' },
  { id: 'market-metrics', type: 'metrics', size: 'medium' }
];

function AppContent() {
  const [gridItems, setGridItems] = useState(defaultGridItems);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        <DashboardGrid 
          items={gridItems} 
          onItemsChange={setGridItems}
          className="min-h-[80vh]" 
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}