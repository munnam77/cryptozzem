import { useState, useEffect } from 'react';
import { ConfigManager } from '../lib/predictions/config';
import { useProviderHealth } from '../hooks/useProviderHealth';
import { XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export function SentimentConfigForm() {
  const [config, setConfig] = useState(() => ConfigManager.getInstance().getConfig());
  const { healthStatus } = useProviderHealth();
  const [newApiKey, setNewApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('Twitter');
  const [error, setError] = useState<string | null>(null);

  const handleProviderToggle = (provider: string) => {
    const configManager = ConfigManager.getInstance();
    configManager.setProviderConfig(provider, {
      enabled: !config.providers[provider].enabled
    });
    setConfig(configManager.getConfig());
  };

  const validateApiKey = (provider: string, key: string): boolean => {
    switch (provider) {
      case 'Twitter':
        return /^[A-Za-z0-9-._~]{32,64}$/.test(key);
      case 'Reddit':
        return key.includes(':') && key.split(':').length === 2;
      case 'News':
        return /^[A-Za-z0-9]{32}$/.test(key);
      default:
        return true;
    }
  };

  const handleApiKeyAdd = () => {
    if (!newApiKey.trim()) {
      setError('API key cannot be empty');
      return;
    }

    if (!validateApiKey(selectedProvider, newApiKey)) {
      setError(`Invalid ${selectedProvider} API key format`);
      return;
    }

    try {
      const configManager = ConfigManager.getInstance();
      configManager.addApiKey(selectedProvider, newApiKey.trim());
      setConfig(configManager.getConfig());
      setNewApiKey('');
      setError(null);
    } catch (err) {
      setError('Failed to add API key');
    }
  };

  const handleApiKeyRemove = (provider: string, key: string) => {
    const configManager = ConfigManager.getInstance();
    configManager.removeApiKey(provider, key);
    setConfig(configManager.getConfig());
  };

  const handleWeightChange = (provider: string, weight: number) => {
    if (weight < 0 || weight > 1) return;
    const configManager = ConfigManager.getInstance();
    configManager.setProviderConfig(provider, { weight });
    setConfig(configManager.getConfig());
  };

  const handleRetrySettingChange = (
    provider: string,
    setting: keyof NonNullable<typeof config.providers.Twitter.retryStrategy>,
    value: number
  ) => {
    if (value < 0) return;
    const configManager = ConfigManager.getInstance();
    configManager.setProviderConfig(provider, {
      retryStrategy: {
        ...config.providers[provider].retryStrategy,
        [setting]: value
      }
    });
    setConfig(configManager.getConfig());
  };

  return (
    <div className="space-y-6">
      {Object.entries(config.providers).map(([provider, settings]) => {
        const status = healthStatus.find(s => s.provider === provider);
        
        return (
          <div key={provider} className="space-y-4 p-4 border rounded-lg dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold">{provider}</h3>
                {status && (
                  <div className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    status.status === 'healthy' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
                    status.status === 'degraded' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
                    status.status === 'down' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  )}>
                    {status.status}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleProviderToggle(provider)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium',
                  settings.enabled
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                )}
              >
                {settings.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Weight</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.weight}
                  onChange={(e) => handleWeightChange(provider, parseFloat(e.target.value))}
                  className="mt-1 w-24 px-2 py-1 rounded border dark:border-gray-600 dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="text-sm font-medium">API Keys</label>
                <div className="mt-1 space-y-2">
                  {settings.apiKeys.map((key) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <code className="text-sm">
                        {key.substring(0, 8)}...{key.substring(key.length - 8)}
                      </code>
                      <button
                        onClick={() => handleApiKeyRemove(provider, key)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {settings.retryStrategy && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Retry Settings</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs">Attempts</label>
                      <input
                        type="number"
                        min="1"
                        value={settings.retryStrategy.attempts}
                        onChange={(e) => handleRetrySettingChange(provider, 'attempts', parseInt(e.target.value))}
                        className="mt-1 w-full px-2 py-1 rounded border dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs">Base Delay (ms)</label>
                      <input
                        type="number"
                        min="0"
                        value={settings.retryStrategy.baseDelay}
                        onChange={(e) => handleRetrySettingChange(provider, 'baseDelay', parseInt(e.target.value))}
                        className="mt-1 w-full px-2 py-1 rounded border dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs">Max Delay (ms)</label>
                      <input
                        type="number"
                        min="0"
                        value={settings.retryStrategy.maxDelay}
                        onChange={(e) => handleRetrySettingChange(provider, 'maxDelay', parseInt(e.target.value))}
                        className="mt-1 w-full px-2 py-1 rounded border dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs">Timeout (ms)</label>
                      <input
                        type="number"
                        min="0"
                        value={settings.retryStrategy.timeout}
                        onChange={(e) => handleRetrySettingChange(provider, 'timeout', parseInt(e.target.value))}
                        className="mt-1 w-full px-2 py-1 rounded border dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="mt-6 space-y-4">
        <h4 className="text-md font-medium">Add New API Key</h4>
        <div className="flex space-x-4">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-2 rounded border dark:border-gray-600 dark:bg-gray-700"
          >
            {Object.keys(config.providers).map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
          <input
            type="password"
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
            placeholder="Enter API key"
            className="flex-1 px-3 py-2 rounded border dark:border-gray-600 dark:bg-gray-700"
          />
          <button
            onClick={handleApiKeyAdd}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Key
          </button>
        </div>
        {error && (
          <div className="flex items-center space-x-2 text-red-500">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}