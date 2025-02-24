import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ForumThread } from './ForumThread';
import { LoadingSpinner } from './LoadingSpinner';
import { ArrowLeft, Send } from 'lucide-react';

interface Reply {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  parentId?: string;
}

export function Discussion() {
  const [post, setPost] = useState<any>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDiscussion();
  }, [postId]);

  const loadDiscussion = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement API call to fetch post and replies
      // Mock data for now
      setPost({
        id: postId,
        userId: 'user1',
        username: 'CryptoTrader',
        content: 'Loading discussion...',
        timestamp: new Date(),
        likes: 0,
        replies: 0,
        tags: ['Discussion']
      });
      setReplies([]);
    } catch (error) {
      console.error('Error loading discussion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async () => {
    if (!user || !newReply.trim()) return;

    try {
      // TODO: Implement API call to create reply
      const reply: Reply = {
        id: Date.now().toString(),
        userId: user.id,
        username: user.username,
        content: newReply,
        timestamp: new Date(),
        parentId: postId
      };

      setReplies(prev => [...prev, reply]);
      setNewReply('');
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 dark:text-gray-400 mb-6 hover:text-gray-900 dark:hover:text-gray-200"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Forum
      </button>

      {post && <ForumThread post={post} className="mb-8" />}

      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h3>

        {user && (
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Add a reply..."
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleReply}
              disabled={!newReply.trim()}
              className="px-4 py-2 bg-primary dark:bg-primary-dark text-white rounded-md
                     hover:bg-primary/90 dark:hover:bg-primary-dark/90 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="space-y-4">
          {replies.map(reply => (
            <div
              key={reply.id}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 ml-6 border-l-2 border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {reply.username}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(reply.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-gray-700 dark:text-gray-300">{reply.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}