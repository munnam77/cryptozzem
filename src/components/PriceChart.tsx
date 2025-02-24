import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import { useBinanceData } from '../hooks/useBinanceData';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { TechnicalIndicators } from '../lib/utils/technicalIndicators';
import { useState, useMemo, useRef, useEffect } from 'react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

type IndicatorType = 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger';

interface PriceChartProps {
  symbol: string;
  timeframe?: string;
  className?: string;
  isVisible?: boolean;
}

export function PriceChart({ symbol, timeframe = '1m', className, isVisible = true }: PriceChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartRef = useRef<ChartJS>(null);
  const [activeIndicators, setActiveIndicators] = useState<IndicatorType[]>([]);
  
  // Only fetch data when visible
  const { historicalPrices, error, isLoading } = useBinanceData(symbol, timeframe, isVisible);

  // Memoize chart data and calculations to prevent unnecessary re-renders
  const chartData = useMemo(() => ({
    labels: historicalPrices.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: `${symbol} Price`,
        data: historicalPrices.map(d => d.price),
        borderColor: isDark ? '#3B82F6' : '#2563EB',
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHitRadius: 10,
        pointHoverRadius: 4,
      },
      // Add indicators only if they are active
      ...getIndicatorDatasets(historicalPrices, activeIndicators, isDark),
    ],
  }), [historicalPrices, symbol, isDark, activeIndicators]);

  // Memoize chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
            modifierKey: 'ctrl',
          },
          pinch: {
            enabled: true,
          },
          drag: {
            enabled: true,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
          },
          mode: 'xy',
        },
        pan: {
          enabled: true,
          mode: 'xy',
        },
        limits: {
          x: { min: 'original', max: 'original' },
          y: { min: 'original', max: 'original' },
        },
      },
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#F9FAFB' : '#111827',
        },
      },
      title: {
        display: true,
        text: `${symbol} Price Chart ${timeframe ? `(${timeframe})` : ''}`,
        color: isDark ? '#F9FAFB' : '#111827',
      },
      tooltip: {
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        titleColor: isDark ? '#F9FAFB' : '#111827',
        bodyColor: isDark ? '#F9FAFB' : '#111827',
        borderColor: isDark ? '#374151' : '#E5E7EB',
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? '#374151' : '#E5E7EB',
          borderColor: 'transparent',
        },
        ticks: {
          color: isDark ? '#9CA3AF' : '#6B7280',
        },
      },
      y: {
        grid: {
          color: isDark ? '#374151' : '#E5E7EB',
          borderColor: 'transparent',
        },
        ticks: {
          color: isDark ? '#9CA3AF' : '#6B7280',
          callback: (value) => `$${value}`,
        },
      },
    },
  }), [isDark]);

  // Update chart less frequently when not visible
  const updateInterval = useRef<number>();
  useEffect(() => {
    if (chartRef.current) {
      if (isVisible) {
        updateInterval.current = window.setInterval(() => {
          chartRef.current?.update();
        }, 1000);
      } else {
        updateInterval.current = window.setInterval(() => {
          chartRef.current?.update();
        }, 5000);
      }
    }
    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div className={cn("w-full h-full min-h-[300px] flex items-center justify-center", className)}>
        <div className="text-gray-500 dark:text-gray-400">Chart paused</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div data-testid="price-chart" className={cn("w-full h-full", className)}>
      <div className="flex items-center justify-between gap-2 mb-4 px-4">
        <div className="flex gap-2">
          <button
            onClick={() => toggleIndicator('sma')}
            className={cn(
              "px-3 py-1 text-sm rounded-full transition-colors",
              activeIndicators.includes('sma')
                ? "bg-green-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}
          >
            SMA
          </button>
          <button
            onClick={() => toggleIndicator('ema')}
            className={cn(
              "px-3 py-1 text-sm rounded-full transition-colors",
              activeIndicators.includes('ema')
                ? "bg-purple-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}
          >
            EMA
          </button>
          <button
            onClick={() => toggleIndicator('bollinger')}
            className={cn(
              "px-3 py-1 text-sm rounded-full transition-colors",
              activeIndicators.includes('bollinger')
                ? "bg-amber-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}
          >
            BB
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetZoom}
            className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-800 
                     text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700
                     transition-colors"
          >
            Reset Zoom
          </button>
        </div>
      </div>
      <div className="p-4">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      <div data-testid="chart-indicators" className="absolute top-2 right-2 flex gap-2">
        {activeIndicators.map(indicator => (
          <div
            key={indicator}
            className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800"
          >
            {indicator.toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}

function getIndicatorDatasets(historicalPrices, activeIndicators, isDark) {
  const indicators = {
    sma: TechnicalIndicators.calculateSMA(historicalPrices.map(p => p.price), 20),
    ema: TechnicalIndicators.calculateEMA(historicalPrices.map(p => p.price), 20),
    bollinger: TechnicalIndicators.calculateBollingerBands(historicalPrices.map(p => p.price))
  };

  return [
    ...(activeIndicators.includes('sma') ? [{
      label: 'SMA 20',
      data: Array(historicalPrices.length - indicators.sma.length).fill(null).concat(indicators.sma),
      borderColor: '#10B981',
      borderWidth: 1.5,
      pointRadius: 0,
      fill: false,
    }] : []),
    ...(activeIndicators.includes('ema') ? [{
      label: 'EMA 20',
      data: Array(historicalPrices.length - indicators.ema.length).fill(null).concat(indicators.ema),
      borderColor: '#8B5CF6',
      borderWidth: 1.5,
      pointRadius: 0,
      fill: false,
    }] : []),
    ...(activeIndicators.includes('bollinger') ? [
      {
        label: 'Bollinger Upper',
        data: Array(historicalPrices.length - indicators.bollinger.upper.length)
          .fill(null)
          .concat(indicators.bollinger.upper),
        borderColor: '#F59E0B',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Bollinger Lower',
        data: Array(historicalPrices.length - indicators.bollinger.lower.length)
          .fill(null)
          .concat(indicators.bollinger.lower),
        borderColor: '#F59E0B',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      }
    ] : []),
  ];
}