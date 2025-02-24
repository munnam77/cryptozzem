interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
}

interface BackoffConfig {
  initialDelay: number;
  maxDelay: number;
  factor: number;
  jitter: boolean;
}

export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.handleFailure();
      throw error;
    }
  }

  private handleFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  getState(): string {
    return this.state;
  }
}

export class ExponentialBackoff {
  private attempts: number = 0;

  constructor(private config: BackoffConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    while (true) {
      try {
        return await operation();
      } catch (error) {
        this.attempts++;
        const delay = this.calculateDelay();
        
        if (!this.shouldRetry(error)) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private calculateDelay(): number {
    const baseDelay = this.config.initialDelay * Math.pow(this.config.factor, this.attempts - 1);
    const maxDelay = this.config.maxDelay;
    
    let delay = Math.min(baseDelay, maxDelay);
    
    if (this.config.jitter) {
      delay = Math.random() * delay;
    }
    
    return delay;
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors and rate limits
    return (
      error.name === 'NetworkError' ||
      error.message.includes('rate limit') ||
      (error.status && error.status >= 500) ||
      error.code === 'ECONNRESET'
    );
  }

  reset(): void {
    this.attempts = 0;
  }
}

export class RetryStrategy {
  constructor(
    private circuitBreaker: CircuitBreaker,
    private backoff: ExponentialBackoff
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return this.circuitBreaker.execute(() => 
      this.backoff.execute(operation)
    );
  }

  reset(): void {
    this.circuitBreaker.reset();
    this.backoff.reset();
  }
}

import { ConfigManager } from './config';

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly provider: string
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

interface RetryOptions {
  attempts: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
}

export async function withRetry<T>(
  provider: string,
  operation: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const config = ConfigManager.getInstance().getConfig();
  const providerConfig = config.providers[provider];
  
  if (!providerConfig?.retryStrategy) {
    return operation();
  }

  const retryOptions: RetryOptions = {
    ...providerConfig.retryStrategy,
    ...options
  };

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt < retryOptions.attempts) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), retryOptions.timeout);
      });

      const operationPromise = operation();
      const result = await Promise.race([operationPromise, timeoutPromise]);
      return result as T;
    } catch (error) {
      lastError = error as Error;
      attempt++;

      if (attempt < retryOptions.attempts) {
        const delay = Math.min(
          retryOptions.baseDelay * Math.pow(2, attempt - 1),
          retryOptions.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new RetryError(
    `Failed after ${attempt} attempts: ${lastError?.message}`,
    attempt,
    provider
  );
}

export async function withFallback<T>(
  providers: string[],
  operation: (provider: string) => Promise<T>,
  errorHandler?: (error: Error, provider: string) => void
): Promise<{ result: T; provider: string }> {
  for (const provider of providers) {
    try {
      const config = ConfigManager.getInstance().getConfig();
      if (!config.providers[provider]?.enabled) continue;

      const result = await operation(provider);
      return { result, provider };
    } catch (error) {
      errorHandler?.(error as Error, provider);
      continue;
    }
  }

  throw new Error('All providers failed');
}