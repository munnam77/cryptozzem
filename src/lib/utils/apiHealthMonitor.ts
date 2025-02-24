import { AuthError } from '../types/auth';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
}

interface HealthStatus {
  isHealthy: boolean;
  lastCheck: number;
  failureCount: number;
  avgResponseTime: number;
}

export class ApiHealthMonitor {
  private static instance: ApiHealthMonitor;
  private healthStatus: Map<string, HealthStatus>;
  private retryConfig: RetryConfig;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
  private healthCheckTimer: NodeJS.Timer | null = null;

  private constructor() {
    this.healthStatus = new Map();
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000,
      timeout: 10000
    };
    this.startHealthCheck();
  }

  static getInstance(): ApiHealthMonitor {
    if (!ApiHealthMonitor.instance) {
      ApiHealthMonitor.instance = new ApiHealthMonitor();
    }
    return ApiHealthMonitor.instance;
  }

  private startHealthCheck() {
    this.healthCheckTimer = setInterval(() => {
      this.checkEndpointHealth();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async checkEndpointHealth() {
    const endpoints = Array.from(this.healthStatus.keys());
    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        await this.pingEndpoint(endpoint);
        const responseTime = Date.now() - start;

        this.updateHealthStatus(endpoint, true, responseTime);
      } catch (error) {
        this.updateHealthStatus(endpoint, false);
      }
    }
  }

  private async pingEndpoint(endpoint: string): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.retryConfig.timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Endpoint unhealthy');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private updateHealthStatus(endpoint: string, isHealthy: boolean, responseTime?: number) {
    const current = this.healthStatus.get(endpoint) || {
      isHealthy: true,
      lastCheck: Date.now(),
      failureCount: 0,
      avgResponseTime: 0
    };

    const status: HealthStatus = {
      isHealthy,
      lastCheck: Date.now(),
      failureCount: isHealthy ? 0 : current.failureCount + 1,
      avgResponseTime: responseTime
        ? (current.avgResponseTime * 0.7 + responseTime * 0.3)
        : current.avgResponseTime
    };

    this.healthStatus.set(endpoint, status);
  }

  async executeWithRetry<T>(
    endpoint: string,
    operation: () => Promise<T>
  ): Promise<T> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.retryConfig.maxAttempts) {
      try {
        const start = Date.now();
        const result = await operation();
        const responseTime = Date.now() - start;

        this.updateHealthStatus(endpoint, true, responseTime);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.updateHealthStatus(endpoint, false);

        if (error instanceof AuthError && error.code !== 'network_error') {
          throw error; // Don't retry auth-specific errors
        }

        attempt++;
        if (attempt < this.retryConfig.maxAttempts) {
          await this.delay(this.calculateDelay(attempt));
        }
      }
    }

    throw lastError || new Error('Operation failed after multiple attempts');
  }

  private calculateDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
      this.retryConfig.maxDelay
    );
    return delay + Math.random() * 1000; // Add jitter
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getEndpointHealth(endpoint: string): HealthStatus {
    return (
      this.healthStatus.get(endpoint) || {
        isHealthy: true,
        lastCheck: Date.now(),
        failureCount: 0,
        avgResponseTime: 0
      }
    );
  }

  updateRetryConfig(config: Partial<RetryConfig>) {
    this.retryConfig = {
      ...this.retryConfig,
      ...config
    };
  }

  cleanup() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }
}