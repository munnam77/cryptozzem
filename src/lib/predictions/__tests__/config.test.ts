import { ConfigManager, defaultConfig, SentimentConfig } from '../config';

describe('ConfigManager', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};
    global.localStorage = {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => { mockLocalStorage[key] = value },
      clear: () => { mockLocalStorage = {} },
      removeItem: (key: string) => { delete mockLocalStorage[key] },
      length: 0,
      key: (index: number) => '',
    };

    // Reset singleton instance
    (ConfigManager as any).instance = null;
  });

  test('returns default config when no stored config exists', () => {
    const manager = ConfigManager.getInstance();
    const config = manager.getConfig();
    expect(config).toEqual(defaultConfig);
  });

  test('stores API keys separately from main config', () => {
    const manager = ConfigManager.getInstance();
    const testApiKey = 'test-api-key';

    manager.addApiKey('Twitter', testApiKey);

    const storedConfig = JSON.parse(mockLocalStorage['sentiment-config']);
    const storedKeys = JSON.parse(mockLocalStorage['sentiment-api-keys']);

    expect(storedConfig.providers.Twitter.apiKeys).toEqual([]);
    expect(storedKeys.Twitter).toEqual([testApiKey]);
  });

  test('validates and sanitizes malformed config', () => {
    mockLocalStorage['sentiment-config'] = JSON.stringify({
      providers: {
        Twitter: {
          enabled: true,
          weight: 999, // Invalid weight
          invalidField: 'test'
        },
        InvalidProvider: { // Unknown provider
          enabled: true
        }
      },
      updateInterval: -1000, // Invalid interval
    });

    const manager = ConfigManager.getInstance();
    const config = manager.getConfig();

    expect(config.providers.Twitter.weight).toBe(defaultConfig.providers.Twitter.weight);
    expect(config.providers).not.toHaveProperty('InvalidProvider');
    expect(config.updateInterval).toBe(defaultConfig.updateInterval);
  });

  test('supports multiple API keys per provider', () => {
    const manager = ConfigManager.getInstance();
    const keys = ['key1', 'key2', 'key3'];

    keys.forEach(key => manager.addApiKey('Twitter', key));
    manager.removeApiKey('Twitter', 'key2');

    const storedKeys = JSON.parse(mockLocalStorage['sentiment-api-keys']);
    expect(storedKeys.Twitter).toEqual(['key1', 'key3']);
  });

  test('preserves retry strategy settings when updating config', () => {
    const manager = ConfigManager.getInstance();
    const customStrategy = {
      attempts: 10,
      baseDelay: 5000,
      maxDelay: 60000,
      timeout: 15000
    };

    manager.setProviderConfig('Twitter', {
      enabled: true,
      retryStrategy: customStrategy
    });

    const config = manager.getConfig();
    expect(config.providers.Twitter.retryStrategy).toEqual(customStrategy);
  });

  test('handles concurrent modifications safely', () => {
    const manager1 = ConfigManager.getInstance();
    const manager2 = ConfigManager.getInstance();

    manager1.addApiKey('Twitter', 'key1');
    manager2.addApiKey('Twitter', 'key2');

    const config = manager1.getConfig();
    expect(config.providers.Twitter.apiKeys).toContain('key1');
    expect(config.providers.Twitter.apiKeys).toContain('key2');
  });
});