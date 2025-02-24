import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ForumThread } from './ForumThread';
import { LoadingSpinner } from './LoadingSpinner';
import { Plus, Search, Filter } from 'lucide-react';
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

export function Forum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const { user } = useAuth();

  const availableTags = [
    'Technical Analysis', 'Price Action', 'Sentiment', 'Trading Strategy',
    'Market News', 'Crypto News', 'Signal Discussion', 'General Discussion'
  ];

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // TODO: Implement search functionality
  };

  const handleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleNewPost = async (content: string, tags: string[]) => {
    if (!user || !content.trim()) return;

    try {
      setIsLoading(true);
      // TODO: Implement API call to create new post
      const newPost = {
        id: Date.now().toString(),
        userId: user.id,
        username: user.username,
        content,
        timestamp: new Date(),
        likes: 0,
        replies: 0,
        tags,
        isLiked: false
      };

      setPosts(prev => [newPost, ...prev]);
      setShowNewPostForm(false);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Forum</h1>
        {user && (
          <button
            onClick={() => setShowNewPostForm(true)}
            className="flex items-center px-4 py-2 bg-primary dark:bg-primary-dark text-white rounded-md
                     hover:bg-primary/90 dark:hover:bg-primary-dark/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </button>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="w-5 h-5 text-gray-400" />
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagFilter(tag)}
              className={cn(
                'px-3 py-1 text-sm rounded-full whitespace-nowrap',
                selectedTags.includes(tag)
                  ? 'bg-primary dark:bg-primary-dark text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <ForumThread key={post.id} post={post} />
          ))}
          {posts.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No discussions yet. Be the first to start one!
            </div>
          )}
        </div>
      )}

      {showNewPostForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Post</h2>
            <textarea
              placeholder="What's on your mind?"
              rows={4}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md mb-4
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagFilter(tag)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-full',
                    selectedTags.includes(tag)
                      ? 'bg-primary dark:bg-primary-dark text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowNewPostForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleNewPost('Sample content', selectedTags)}
                className="px-4 py-2 bg-primary dark:bg-primary-dark text-white rounded-md
                         hover:bg-primary/90 dark:hover:bg-primary-dark/90"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}