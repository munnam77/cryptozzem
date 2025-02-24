import { useState } from 'react';
import { Bell, AlertTriangle, X } from 'lucide-react';
import { useAlerts, type PriceAlert } from '../contexts/AlertContext';
import { cn } from '../lib/utils';

interface AlertManagerProps {
  symbol: string;
  currentPrice: number;
}

export function AlertManager({ symbol, currentPrice }: AlertManagerProps) {
  const { alerts, addAlert, removeAlert, clearTriggeredAlerts } = useAlerts();
  const [showForm, setShowForm] = useState(false);
  const [targetPrice, setTargetPrice] = useState(currentPrice.toString());
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const symbolAlerts = alerts.filter(alert => alert.symbol === symbol);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAlert({
      symbol,
      targetPrice: parseFloat(targetPrice),
      condition,
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">New Price Alert</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Alert me when price goes
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCondition('above')}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium rounded-md",
                  condition === 'above'
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                )}
              >
                Above
              </button>
              <button
                type="button"
                onClick={() => setCondition('below')}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium rounded-md",
                  condition === 'below'
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                )}
              >
                Below
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Target Price (USD)
            </label>
            <input
              type="number"
              step="0.00000001"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter target price"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md"
          >
            Create Alert
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary dark:text-primary-dark hover:bg-primary/10 rounded-md"
        >
          <Bell className="w-4 h-4" />
          Set Price Alert
        </button>
      )}

      {symbolAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Active Alerts</h3>
            <button
              onClick={clearTriggeredAlerts}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear Triggered
            </button>
          </div>
          <div className="space-y-2">
            {symbolAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md",
                  alert.triggered
                    ? "bg-yellow-50 dark:bg-yellow-900/20"
                    : "bg-gray-50 dark:bg-gray-800"
                )}
              >
                <div className="flex items-center gap-2">
                  {alert.triggered ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Bell className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm">
                    When price goes {alert.condition} ${alert.targetPrice}
                  </span>
                </div>
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}