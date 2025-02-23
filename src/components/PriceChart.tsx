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
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import { useBinanceData } from '../hooks/useBinanceData';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PriceChartProps {
  symbol: string;
  data: {
    timestamp: number;
    price: number;
  }[];
  timeframe?: string;
  className?: string;
}

export function PriceChart({ symbol, timeframe = '1m', className }: Omit<PriceChartProps, 'data'>) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { historicalPrices, error, isLoading } = useBinanceData(symbol, timeframe);

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

  const chartData = {
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
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
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
        displayColors: false,
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
  };

  return (
    <div className={cn("w-full h-full min-h-[300px] p-4", className)}>
      <Line data={chartData} options={options} />
    </div>
  );
}