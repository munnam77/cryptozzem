export interface SharedSignal {
  id: string;
  userId: string;
  username: string;
  symbol: string;
  timeframe: string;
  prediction: {
    type: 'bullish' | 'bearish';
    targetPrice: number;
    stopLoss?: number;
    confidence: number;
  };
  analysis: {
    technical: string;
    sentiment: string;
    reasoning: string;
  };
  timestamp: Date;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface SignalFilter {
  symbol?: string;
  timeframe?: string;
  type?: 'bullish' | 'bearish';
  userId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export class SignalService {
  private static instance: SignalService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = '/api/signals';
  }

  static getInstance(): SignalService {
    if (!this.instance) {
      this.instance = new SignalService();
    }
    return this.instance;
  }

  async getSignals(filters?: SignalFilter): Promise<SharedSignal[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch signals');
    return response.json();
  }

  async shareSignal(signal: Omit<SharedSignal, 'id' | 'userId' | 'username' | 'timestamp' | 'likes' | 'comments'>): Promise<SharedSignal> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signal)
    });
    if (!response.ok) throw new Error('Failed to share signal');
    return response.json();
  }

  async likeSignal(signalId: string): Promise<{ likes: number; isLiked: boolean }> {
    const response = await fetch(`${this.baseUrl}/${signalId}/like`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to like signal');
    return response.json();
  }

  async saveSignal(signalId: string): Promise<{ isSaved: boolean }> {
    const response = await fetch(`${this.baseUrl}/${signalId}/save`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to save signal');
    return response.json();
  }

  async getComments(signalId: string): Promise<Comment[]> {
    const response = await fetch(`${this.baseUrl}/${signalId}/comments`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    return response.json();
  }

  async addComment(signalId: string, content: string): Promise<Comment> {
    const response = await fetch(`${this.baseUrl}/${signalId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
  }

  async getUserSignals(userId: string): Promise<SharedSignal[]> {
    const response = await fetch(`${this.baseUrl}/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user signals');
    return response.json();
  }

  async getSavedSignals(): Promise<SharedSignal[]> {
    const response = await fetch(`${this.baseUrl}/saved`);
    if (!response.ok) throw new Error('Failed to fetch saved signals');
    return response.json();
  }

  async deleteSignal(signalId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${signalId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete signal');
  }
}