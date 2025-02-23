import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { TimeDisplay } from './components/TimeDisplay';
import { CoinPrediction } from './components/CoinPrediction';
import { AccuracyMeter } from './components/AccuracyMeter';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { useBinanceData } from './hooks/useBinanceData';
import { Coins } from 'lucide-react';

const timeframes = ['15m', '30m', '1h', '4h', '1D'];
const watchedSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT'];

function App() {
  const { prices, loading, error } = useBinanceData(watchedSymbols);

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return <ErrorMessage message={error} />;
    }

    return (
      <Tabs.Root defaultValue="15m" className="bg-white rounded-lg shadow-sm p-4">
        <Tabs.List className="flex space-x-2 border-b mb-4">
          {timeframes.map(timeframe => (
            <Tabs.Trigger
              key={timeframe}
              value={timeframe}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:border-blue-500"
            >
              {timeframe}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {timeframes.map(timeframe => (
          <Tabs.Content key={timeframe} value={timeframe} className="space-y-4">
            {prices.map((price, index) => (
              <CoinPrediction
                key={price.symbol}
                symbol={price.symbol}
                predictedGain={price.change24h}
                confidence={75 - (index * 5)} // Mock confidence scores
                timeframe={timeframe}
              />
            ))}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Coins className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">CryptoSignal Zzem</h1>
            </div>
            <TimeDisplay />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Accuracy Meters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {timeframes.map(timeframe => (
            <AccuracyMeter
              key={timeframe}
              timeframe={timeframe}
              accuracy={65 + Math.floor(Math.random() * 15)}
            />
          ))}
        </div>

        {renderContent()}
      </main>
    </div>
  );
}

export default App;