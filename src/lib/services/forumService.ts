export interface ForumPost {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: number;
  tags: string[];
  isLiked?: boolean;
}

export interface Reply {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  parentId?: string;
}

export interface CreatePostData {
  content: string;
  tags: string[];
}

export interface CreateReplyData {
  content: string;
  parentId: string;
}

export class ForumService {
  private static instance: ForumService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = '/api/forum';
  }

  static getInstance(): ForumService {
    if (!this.instance) {
      this.instance = new ForumService();
    }
    return this.instance;
  }

  async getPosts(filters?: { search?: string; tags?: string[] }): Promise<ForumPost[]> {
    let url = `${this.baseUrl}/posts`;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return response.json();
  }

  async getPost(postId: string): Promise<{ post: ForumPost; replies: Reply[] }> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}`);
    if (!response.ok) throw new Error('Failed to fetch post');
    return response.json();
  }

  async createPost(data: CreatePostData): Promise<ForumPost> {
    const response = await fetch(`${this.baseUrl}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create post');
    return response.json();
  }

  async createReply(data: CreateReplyData): Promise<Reply> {
    const response = await fetch(`${this.baseUrl}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create reply');
    return response.json();
  }

  async toggleLike(postId: string): Promise<{ likes: number; isLiked: boolean }> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}/like`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to toggle like');
    return response.json();
  }

  async getReplies(postId: string): Promise<Reply[]> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}/replies`);
    if (!response.ok) throw new Error('Failed to fetch replies');
    return response.json();
  }
}