export interface LeaderboardUser {
  id: string;
  username: string;
  rank: number;
  score: number;
  accuracy: number;
  contributions: number;
  signalQuality: number;
  achievements?: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

export type Timeframe = 'weekly' | 'monthly' | 'allTime';
export type SortField = 'rank' | 'accuracy' | 'contributions' | 'signalQuality';

export class LeaderboardService {
  private static instance: LeaderboardService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = '/api/leaderboard';
  }

  static getInstance(): LeaderboardService {
    if (!this.instance) {
      this.instance = new LeaderboardService();
    }
    return this.instance;
  }

  async getLeaderboard(timeframe: Timeframe, sortField: SortField): Promise<LeaderboardUser[]> {
    const params = new URLSearchParams({ timeframe, sortField });
    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/achievements`);
    if (!response.ok) throw new Error('Failed to fetch user achievements');
    return response.json();
  }

  async getUserStats(userId: string): Promise<Omit<LeaderboardUser, 'rank'>> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/stats`);
    if (!response.ok) throw new Error('Failed to fetch user stats');
    return response.json();
  }

  async getWeeklyHighlights(): Promise<{
    topTrader: LeaderboardUser;
    mostAccurate: LeaderboardUser;
    mostContributions: LeaderboardUser;
  }> {
    const response = await fetch(`${this.baseUrl}/highlights/weekly`);
    if (!response.ok) throw new Error('Failed to fetch weekly highlights');
    return response.json();
  }
}