export interface ProviderConfig {
  enabled: boolean;
  apiKeys: string[];
  weight: number;
  retryStrategy?: {
    attempts: number;
    baseDelay: number;
    maxDelay: number;
    timeout: number;
  };
}

export interface SentimentConfig {
  providers: {
    [key: string]: ProviderConfig;
  };
  updateInterval: number;
  minConfidence: number;
  cacheTimeout: number;
}

export const defaultConfig: SentimentConfig = {
  providers: {
    Twitter: {
      enabled: false,
      apiKeys: [],
      weight: 0.4,
      retryStrategy: {
        attempts: 5,
        baseDelay: 2000,
        maxDelay: 30000,
        timeout: 10000
      }
    },
    Reddit: {
      enabled: false,
      apiKeys: [],
      weight: 0.3,
      retryStrategy: {
        attempts: 3,
        baseDelay: 1000,
        maxDelay: 15000,
        timeout: 10000
      }
    },
    News: {
      enabled: false,
      apiKeys: [],
      weight: 0.3,
      retryStrategy: {
        attempts: 3,
        baseDelay: 1000,
        maxDelay: 15000,
        timeout: 10000
      }
    }
  },
  updateInterval: 1800000, // 30 minutes
  minConfidence: 0.6,
  cacheTimeout: 3600000 // 1 hour
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: SentimentConfig;
  private readonly storageKey = 'sentiment-config';
  private readonly secureStorageKey = 'sentiment-api-keys';

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): SentimentConfig {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const secureStored = localStorage.getItem(this.secureStorageKey);
      
      if (stored) {
        const config = JSON.parse(stored);
        
        // Load API keys from secure storage if available
        if (secureStored) {
          const apiKeys = JSON.parse(secureStored);
          Object.keys(config.providers).forEach(provider => {
            if (apiKeys[provider]) {
              config.providers[provider].apiKeys = apiKeys[provider];
            }
          });
        }
        
        return this.validateConfig(config);
      }
    } catch (error) {
      console.warn('Failed to load sentiment config:', error);
    }
    return { ...defaultConfig };
  }

  private validateConfig(config: any): SentimentConfig {
    const validated: SentimentConfig = { ...defaultConfig };
    
    if (config.providers) {
      Object.keys(defaultConfig.providers).forEach(provider => {
        if (config.providers[provider]) {
          validated.providers[provider] = {
            ...defaultConfig.providers[provider],
            ...config.providers[provider]
          };
        }
      });
    }

    validated.updateInterval = config.updateInterval || defaultConfig.updateInterval;
    validated.minConfidence = config.minConfidence || defaultConfig.minConfidence;
    validated.cacheTimeout = config.cacheTimeout || defaultConfig.cacheTimeout;

    return validated;
  }

  private saveConfig(): void {
    try {
      // Save non-sensitive config
      const configToSave = { ...this.config };
      Object.keys(configToSave.providers).forEach(provider => {
        configToSave.providers[provider] = {
          ...configToSave.providers[provider],
          apiKeys: [] // Don't save API keys in main storage
        };
      });
      
      localStorage.setItem(this.storageKey, JSON.stringify(configToSave));

      // Save API keys separately
      const apiKeys: { [provider: string]: string[] } = {};
      Object.entries(this.config.providers).forEach(([provider, config]) => {
        if (config.apiKeys.length > 0) {
          apiKeys[provider] = config.apiKeys;
        }
      });
      
      localStorage.setItem(this.secureStorageKey, JSON.stringify(apiKeys));
    } catch (error) {
      console.error('Failed to save sentiment config:', error);
    }
  }

  getConfig(): SentimentConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SentimentConfig>): void {
    this.config = this.validateConfig({
      ...this.config,
      ...newConfig
    });
    this.saveConfig();
  }

  setProviderConfig(
    provider: string,
    config: Partial<ProviderConfig>
  ): void {
    if (!this.config.providers[provider]) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    this.config.providers[provider] = {
      ...this.config.providers[provider],
      ...config
    };
    this.saveConfig();
  }

  addApiKey(provider: string, apiKey: string): void {
    if (!this.config.providers[provider]) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    if (!this.config.providers[provider].apiKeys.includes(apiKey)) {
      this.config.providers[provider].apiKeys.push(apiKey);
      this.saveConfig();
    }
  }

  removeApiKey(provider: string, apiKey: string): void {
    if (!this.config.providers[provider]) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const index = this.config.providers[provider].apiKeys.indexOf(apiKey);
    if (index !== -1) {
      this.config.providers[provider].apiKeys.splice(index, 1);
      this.saveConfig();
    }
  }
}