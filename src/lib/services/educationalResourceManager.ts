export interface TradingTip {
  id: string;
  topic: string;
  title: string;
  content: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'technical' | 'fundamental' | 'sentiment' | 'risk';
}

export class EducationalResourceManager {
  private static instance: EducationalResourceManager;
  
  static getInstance(): EducationalResourceManager {
    if (!this.instance) {
      this.instance = new EducationalResourceManager();
    }
    return this.instance;
  }

  async getTradingTips(category?: string | null, level?: string): Promise<TradingTip[]> {
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    if (level) queryParams.append('level', level);

    const response = await fetch(`/api/education/tips?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch trading tips');
    }
    return response.json();
  }

  async getTipById(tipId: string): Promise<TradingTip> {
    const response = await fetch(`/api/education/tips/${tipId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch trading tip');
    }
    return response.json();
  }

  async getRelatedTips(tipId: string): Promise<TradingTip[]> {
    const response = await fetch(`/api/education/tips/${tipId}/related`);
    if (!response.ok) {
      throw new Error('Failed to fetch related tips');
    }
    return response.json();
  }

  async markTipAsRead(userId: string, tipId: string): Promise<void> {
    const response = await fetch('/api/education/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, tipId })
    });

    if (!response.ok) {
      throw new Error('Failed to mark tip as read');
    }
  }

  async getUserProgress(userId: string): Promise<string[]> {
    const response = await fetch(`/api/education/progress/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user progress');
    }
    return response.json();
  }
}