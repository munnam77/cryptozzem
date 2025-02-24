import { UserRole, getRolePermissions } from '../types/roles';

interface ApiLimits {
  requestsPerMinute: number;
  historicalDataDays: number;
  customIndicators: boolean;
  realTimeUpdates: boolean;
}

interface ApiUsage {
  requestsRemaining: number;
  resetTime: Date;
}

const API_LIMITS: Record<UserRole, ApiLimits> = {
  free: {
    requestsPerMinute: 60,
    historicalDataDays: 30,
    customIndicators: false,
    realTimeUpdates: false
  },
  premium: {
    requestsPerMinute: 300,
    historicalDataDays: 365,
    customIndicators: true,
    realTimeUpdates: true
  },
  admin: {
    requestsPerMinute: 1000,
    historicalDataDays: 1825, // 5 years
    customIndicators: true,
    realTimeUpdates: true
  }
};

export class ApiService {
  private static instance: ApiService;
  private usageMap: Map<string, ApiUsage> = new Map();
  
  static getInstance(): ApiService {
    if (!this.instance) {
      this.instance = new ApiService();
    }
    return this.instance;
  }

  getLimits(role: UserRole): ApiLimits {
    return API_LIMITS[role];
  }

  async getApiKey(userId: string): Promise<string> {
    const response = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error('Failed to generate API key');
    }

    const { key } = await response.json();
    return key;
  }

  async revokeApiKey(userId: string): Promise<void> {
    const response = await fetch('/api/keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error('Failed to revoke API key');
    }
  }

  async getUsage(userId: string): Promise<ApiUsage> {
    const response = await fetch(`/api/usage/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch API usage');
    }
    const usage = await response.json();
    this.usageMap.set(userId, usage);
    return usage;
  }

  async validateRequest(userId: string, role: UserRole): Promise<boolean> {
    const limits = this.getLimits(role);
    let usage = this.usageMap.get(userId);

    if (!usage || new Date(usage.resetTime) < new Date()) {
      usage = await this.getUsage(userId);
    }

    return usage.requestsRemaining > 0;
  }

  async getApiDocumentation(): Promise<string> {
    const response = await fetch('/api/documentation');
    if (!response.ok) {
      throw new Error('Failed to fetch API documentation');
    }
    return response.text();
  }
}