import { AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';
import { useProviderHealth } from '../hooks/useProviderHealth';
import { cn } from '../lib/utils';

interface ProviderHealthIndicatorProps {
  className?: string;
}

export function ProviderHealthIndicator({ className }: ProviderHealthIndicatorProps) {
  const { healthStatus, isSystemHealthy } = useProviderHealth();

  const statusIcons = {
    healthy: CheckCircle,
    degraded: AlertTriangle,
    down: XCircle
  };

  const statusColors = {
    healthy: 'text-green-500 dark:text-green-400',
    degraded: 'text-yellow-500 dark:text-yellow-400',
    down: 'text-red-500 dark:text-red-400'
  };

  return (
    <div className={cn('flex flex-col space-y-2', className)} data-testid="provider-health">
      <div className="flex items-center space-x-2">
        <Activity className={cn(
          'h-5 w-5',
          isSystemHealthy ? 'text-green-500' : 'text-red-500'
        )} />
        <span className="text-sm font-medium">
          Sentiment System Status
        </span>
      </div>
      
      <div className="space-y-1">
        {healthStatus.map((status) => {
          const Icon = statusIcons[status.status];
          return (
            <div 
              key={status.provider}
              data-testid={`provider-status-${status.provider.toLowerCase()}`}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center space-x-2">
                <Icon className={cn(
                  'h-4 w-4',
                  statusColors[status.status]
                )} />
                <span>{status.provider}</span>
              </div>
              {status.errors.total > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {status.errors.total} errors
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!isSystemHealthy && (
        <div className="text-xs text-red-500 dark:text-red-400 mt-2">
          Some providers are experiencing issues
        </div>
      )}
    </div>
  );
}