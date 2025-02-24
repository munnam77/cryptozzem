import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ForumPost {
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

interface ForumThreadProps {
  post: ForumPost;
  className?: string;
}

export function ForumThread({ post, className }: ForumThreadProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const { user } = useAuth();

  const handleLike = async () => {
    if (!user) return;
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    // TODO: Implement API call to update like status
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'CryptoSignal Discussion',
        text: post.content,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4', className)}>
      <div className="flex items-start space-x-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{post.username}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(post.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-300">{post.content}</p>

          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded-full bg-primary/10 dark:bg-primary-dark/10 
                         text-primary dark:text-primary-dark"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-4 pt-2">
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center space-x-1 text-sm',
                isLiked ? 'text-primary dark:text-primary-dark' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{likeCount}</span>
            </button>

            <button className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-4 h-4" />
              <span>{post.replies}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}