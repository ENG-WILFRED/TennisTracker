// Example React Component: Community Feed
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCommunityUpdates, useAutoRefresh } from '@/hooks/useCommunityWebSocket';
import { CommentThread } from './CommentThread';

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    email: string;
    image?: string;
  };
  commentCount: number;
  reactionCount: number;
  userHasLiked: boolean;
  comments: Array<{
    id: string;
    postId: string;
    authorId: string;
    content: string;
    parentCommentId?: string | null;
    replies?: any[];
    reactions?: any[];
    author: {
      userId: string;
      user: {
        firstName: string;
        lastName: string;
        email: string;
        photo?: string;
      };
    };
    createdAt: string;
    updatedAt: string;
  }>;
}

export function CommunityFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [newpostContent, setNewpostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Load feed
  async function loadFeed() {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/community?action=feed&page=${page}`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  }

  // Fetch feed on mount and page change
  useEffect(() => {
    loadFeed();
  }, [user, page]);

  // Set up auto-refresh every 30 seconds
  useAutoRefresh(loadFeed, 30000);

  // Subscribe to real-time updates
  const isConnected = useCommunityUpdates(
    // onPostCreated
    (newPost) => {
      console.log('📝 New post received:', newPost);
      setPosts((prev) => [newPost, ...prev]);
    },
    // onCommentAdded
    (data) => {
      console.log('💬 New comment received:', data);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === data.postId) {
            return {
              ...post,
              comments: [...post.comments, data.comment],
              commentCount: post.commentCount + 1,
            };
          }
          return post;
        })
      );
    },
    // onCommentReplyAdded (NEW)
    (reply) => {
      console.log('🔄 Comment reply received:', reply);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === reply.postId) {
            return {
              ...post,
              comments: post.comments.map((comment) =>
                comment.id === reply.parentCommentId
                  ? {
                      ...comment,
                      replies: [...(comment.replies || []), reply],
                    }
                  : comment
              ),
            };
          }
          return post;
        })
      );
    },
    // onCommentReactionAdded (NEW)
    (reaction) => {
      console.log('❤️ Comment reaction added:', reaction);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === reaction.postId) {
            return {
              ...post,
              comments: post.comments.map((comment) =>
                comment.id === reaction.commentId
                  ? {
                      ...comment,
                      reactions: [...(comment.reactions || []), reaction.reaction],
                    }
                  : comment
              ),
            };
          }
          return post;
        })
      );
    },
    // onCommentReactionRemoved (NEW)
    (reaction) => {
      console.log('💔 Comment reaction removed:', reaction);
      setPosts((prev) =>
        prev.map((post) => {
          return {
            ...post,
            comments: post.comments.map((comment) =>
              comment.id === reaction.commentId
                ? {
                    ...comment,
                    reactions: (comment.reactions || []).filter(
                      (r) => !(r.userId === reaction.userId && r.type === reaction.reactionType)
                    ),
                  }
                : comment
            ),
          };
        })
      );
    },
    // onPostLiked
    (data) => {
      console.log('👍 Post reaction:', data);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === data.postId) {
            const isLiking = data.action === 'liked';
            return {
              ...post,
              reactionCount: isLiking
                ? post.reactionCount + 1
                : post.reactionCount - 1,
            };
          }
          return post;
        })
      );
    },
    // onUserFollowed
    (data) => {
      console.log('👥 User follow:', data);
    },
    // onFeedUpdate
    (data) => {
      console.log('📊 Feed update:', data);
    }
  );

  useEffect(() => {
    setWsConnected(isConnected);
  }, [isConnected]);

  // Create post
  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newpostContent.trim() || !session?.user) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-post',
          data: { content: newpostContent }
        })
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts([newPost, ...posts]);
        setNewpostContent('');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setSubmitting(false);
    }
  }

  // Like post
  async function handleLikePost(postId: string) {
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like-post',
          data: { postId }
        })
      });

      if (response.ok) {
        // Update posts state
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              userHasLiked: !post.userHasLiked,
              reactionCount: post.userHasLiked ? post.reactionCount - 1 : post.reactionCount + 1
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  }

  if (!session?.user) {
    return <div>Please sign in to view the feed.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Community Feed</h1>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
          wsConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
        }`}>
          {wsConnected ? '🟢 Live' : '⚪ Updates'}
        </div>
      </div>

      {/* Create Post Form */}
      <form
        onSubmit={handleCreatePost}
        className="bg-white rounded-lg shadow p-4 mb-6"
      >
        <textarea
          value={newpostContent}
          onChange={(e) => setNewpostContent(e.target.value)}
          placeholder="Share your thoughts... 🎾"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!newpostContent.trim() || submitting}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-8">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No posts yet</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow p-4">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-3">
                {post.author.image && (
                  <img
                    src={post.author.image}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <div className="font-semibold">{post.author.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <p className="mb-4">{post.content}</p>

              {/* Interactions */}
              <div className="flex gap-4 text-sm text-gray-600 mb-4 pb-4 border-b">
                <button
                  onClick={() => handleLikePost(post.id)}
                  className={`flex items-center gap-1 hover:text-blue-500 ${
                    post.userHasLiked ? 'text-blue-500' : ''
                  }`}
                >
                  👍 {post.reactionCount}
                </button>
                <button
                  onClick={() => setSelectedPostId(post.id)}
                  className="flex items-center gap-1 hover:text-blue-500 cursor-pointer"
                >
                  💬 {post.commentCount}
                </button>
              </div>

              {/* Expanded Comments Section */}
              {selectedPostId === post.id && (
                <div className="mt-4 pt-4 border-t">
                  <CommentThread
                    postId={post.id}
                    initialComments={post.comments}
                  />
                </div>
              )}

              {/* Comments Preview (when not expanded) */}
              {selectedPostId !== post.id && post.comments.length > 0 && (
                <div className="space-y-2 pt-2 bg-gray-50 p-2 rounded text-sm">
                  {post.comments.slice(0, 2).map((comment) => (
                    <div key={comment.id} className="text-gray-700">
                      <span className="font-semibold">{comment.author.user.firstName}</span>: {comment.content}
                    </div>
                  ))}
                  {post.comments.length > 2 && (
                    <div className="text-blue-500 text-xs italic">+{post.comments.length - 2} more comments</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex justify-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2">Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
