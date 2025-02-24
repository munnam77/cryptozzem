import { useState, useEffect } from 'react';
import { ProviderHealthMonitor, ProviderHealthStatus } from '../lib/predictions/providerHealth';
import { SentimentAnalyzer } from '../lib/predictions/sentimentAnalyzer';

interface ProviderHealthHookResult {
  healthStatus: ProviderHealthStatus[];
  providerStates: { [provider: string]: string };
  totalErrors: number;
  healthyProviders: number;
  isSystemHealthy: boolean;
}

export function useProviderHealth(refreshInterval = 30000): ProviderHealthHookResult {
  const [healthStatus, setHealthStatus] = useState<ProviderHealthStatus[]>([]);
  const [providerStates, setProviderStates] = useState<{ [provider: string]: string }>({});

  useEffect(() => {
    const monitor = ProviderHealthMonitor.getInstance();
    const analyzer = SentimentAnalyzer.getInstance();

    const updateHealth = () => {
      const status = monitor.getAllStatus();
      const states = analyzer.getProviderHealth();
      
      setHealthStatus(status);
      setProviderStates(states);
    };

    updateHealth();
    const interval = setInterval(updateHealth, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const totalErrors = healthStatus.reduce((sum, status) => sum + status.errors.total, 0);
  const healthyProviders = healthStatus.filter(status => status.status === 'healthy').length;
  const isSystemHealthy = healthyProviders >= 2 && // At least 2 healthy providers
    healthStatus.every(status => status.status !== 'down'); // No provider is down

  return {
    healthStatus,
    providerStates,
    totalErrors,
    healthyProviders,
    isSystemHealthy
  };
}