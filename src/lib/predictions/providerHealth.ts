import { retryOperation } from '../utils/cache';

export type HealthStatus = 'healthy' | 'degraded' | 'down';
export type ErrorType = 'rateLimit' | 'network' | 'auth' | 'other';

interface LatencyStats {
  min: number;
  max: number;
  avg: number;
  samples: number;
}

interface ErrorStats {
  rateLimit: number;
  network: number;
  auth: number;
  other: number;
  total: number;
}

export interface ProviderStatus {
  provider: string;
  status: HealthStatus;
  lastCheck: number;
  errorCount: number;
  lastError?: string;
  lastSuccess?: number;
  latency: LatencyStats;
  errors: ErrorStats;
}

export class ProviderHealthMonitor {
  private static instance: ProviderHealthMonitor;
  private providerStatus: Map<string, ProviderStatus> = new Map();

  private constructor() {}

  static getInstance(): ProviderHealthMonitor {
    if (!ProviderHealthMonitor.instance) {
      ProviderHealthMonitor.instance = new ProviderHealthMonitor();
    }
    return ProviderHealthMonitor.instance;
  }

  private getDefaultStats(): { latency: LatencyStats; errors: ErrorStats } {
    return {
      latency: {
        min: Infinity,
        max: 0,
        avg: 0,
        samples: 0
      },
      errors: {
        rateLimit: 0,
        network: 0,
        auth: 0,
        other: 0,
        total: 0
      }
    };
  }

  recordSuccess(provider: string, timestamp = Date.now(), latency?: number): void {
    const status = this.getOrCreateStatus(provider);
    status.lastSuccess = timestamp;
    status.errorCount = Math.max(0, status.errorCount - 1);
    status.lastCheck = timestamp;

    if (typeof latency === 'number') {
      this.updateLatencyStats(status, latency);
    }

    this.updateStatus(provider);
  }

  private updateLatencyStats(status: ProviderStatus, latency: number): void {
    status.latency.min = Math.min(status.latency.min, latency);
    status.latency.max = Math.max(status.latency.max, latency);
    status.latency.avg = (status.latency.avg * status.latency.samples + latency) / (status.latency.samples + 1);
    status.latency.samples++;
  }

  private getErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    if (message.includes('rate limit') || message.includes('429')) return 'rateLimit';
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) return 'network';
    if (message.includes('auth') || message.includes('401') || message.includes('403')) return 'auth';
    return 'other';
  }

  recordError(provider: string, error: Error): void {
    const status = this.getOrCreateStatus(provider);
    status.errorCount++;
    status.lastError = error.message;
    status.lastCheck = Date.now();

    const errorType = this.getErrorType(error);
    status.errors[errorType]++;
    status.errors.total++;

    this.updateStatus(provider);
  }

  private getOrCreateStatus(provider: string): ProviderStatus {
    if (!this.providerStatus.has(provider)) {
      const defaultStats = this.getDefaultStats();
      this.providerStatus.set(provider, {
        provider,
        status: 'healthy',
        lastCheck: Date.now(),
        errorCount: 0,
        ...defaultStats
      });
    }
    return this.providerStatus.get(provider)!;
  }

  private updateStatus(provider: string): void {
    const status = this.providerStatus.get(provider)!;
    
    if (status.errorCount >= 8) {
      status.status = 'down';
    } else if (status.errorCount >= 3) {
      status.status = 'degraded';
    } else {
      status.status = 'healthy';
    }
  }

  getAllStatus(): ProviderStatus[] {
    return Array.from(this.providerStatus.values());
  }

  getProviderStatus(provider: string): ProviderStatus {
    return this.getOrCreateStatus(provider);
  }

  reset(provider: string): void {
    const defaultStats = this.getDefaultStats();
    this.providerStatus.set(provider, {
      provider,
      status: 'healthy',
      lastCheck: Date.now(),
      errorCount: 0,
      ...defaultStats
    });
  }
}