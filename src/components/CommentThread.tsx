'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCommunityUpdates } from '@/hooks/useCommunityWebSocket';

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentCommentId?: string | null;
  replies?: Comment[];
  reactions?: Array<{ id: string; userId: string; type: string }>;
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
}

interface CommentThreadProps {
  postId: string;
  initialComments: Comment[];
}

export function CommentThread({ postId, initialComments }: CommentThreadProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Real-time updates via WebSocket
  const isConnected = useCommunityUpdates(
    undefined, // onPostCreated
    (comment) => {
      // New top-level comment added
      if (comment.postId === postId && !comment.parentCommentId) {
        setComments((prev) => [comment, ...prev]);
      }
    },
    (reply) => {
      // New reply to a comment
      if (reply.postId === postId && reply.parentCommentId) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === reply.parentCommentId
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), reply],
                }
              : comment
          )
        );
      }
    },
    (reactionData) => {
      // Reaction added to comment
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === reactionData.commentId
            ? {
                ...comment,
                reactions: [...(comment.reactions || []), reactionData.reaction],
              }
            : comment
        )
      );
    },
    (reactionData) => {
      // Reaction removed from comment
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === reactionData.commentId
            ? {
                ...comment,
                reactions: (comment.reactions || []).filter(
                  (r) => !(r.userId === reactionData.userId && r.type === reactionData.reactionType)
                ),
              }
            : comment
        )
      );
    }
  );

  const handleReplySubmit = async (parentCommentId: string) => {
    if (!replyContent.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply-to-comment',
          userId: session?.user?.email || 'unknown-user',
          data: {
            commentId: parentCommentId,
            content: replyContent,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to post reply');

      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactToComment = async (commentId: string, reactionType: string = 'like') => {
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'react-to-comment',
          userId: session?.user?.email || 'unknown-user',
          data: {
            commentId,
            reactionType,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to react to comment');
    } catch (error) {
      console.error('Error reacting to comment:', error);
    }
  };

  const getReactionEmoji = (type: string) => {
    const emojis: { [key: string]: string } = {
      like: '👍',
      love: '❤️',
      haha: '😂',
      wow: '😮',
      sad: '😢',
      angry: '😠',
    };
    return emojis[type] || '👍';
  };

  const groupReactionsByType = (reactions?: Array<{ type: string }>) => {
    if (!reactions) return {};
    return reactions.reduce(
      (acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number }
    );
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`comment ${isReply ? 'reply' : 'top-level'} mb-4`}>
      {/* Comment Header */}
      <div className="flex items-center gap-3 mb-2">
        {comment.author.user.photo && (
          <img
            src={comment.author.user.photo}
            alt={comment.author.user.firstName}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className="flex-1">
          <div className="font-semibold text-sm">
            {comment.author.user.firstName} {comment.author.user.lastName}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(comment.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Comment Content */}
      <p className="text-sm mb-3 text-gray-700">{comment.content}</p>

      {/* Comment Reactions */}
      {comment.reactions && comment.reactions.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {Object.entries(groupReactionsByType(comment.reactions)).map(([type, count]) => (
            <div key={type} className="bg-gray-100 rounded px-2 py-1 text-xs flex items-center gap-1">
              <span>{getReactionEmoji(type)}</span>
              <span className="text-gray-600">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Comment Actions */}
      <div className="flex gap-4 mb-3 text-xs">
        <button
          onClick={() => setReplyingTo(comment.id)}
          className="text-blue-500 hover:text-blue-700 font-medium"
        >
          💬 Reply
        </button>
        <div className="flex gap-2">
          {['like', 'love', 'haha', 'wow', 'sad', 'angry'].map((type) => (
            <button
              key={type}
              onClick={() => handleReactToComment(comment.id, type)}
              className="hover:scale-125 transition-transform"
              title={type}
            >
              {getReactionEmoji(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="bg-gray-50 p-3 rounded mb-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="w-full text-sm border border-gray-300 rounded p-2 mb-2"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleReplySubmit(comment.id)}
              disabled={loading || !replyContent.trim()}
              className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Reply'}
            </button>
            <button
              onClick={() => {
                setReplyingTo(null);
                setReplyContent('');
              }}
              className="text-gray-600 text-sm px-3 py-1 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 mt-3 border-l-2 border-gray-200 pl-3">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="comments-section">
      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        <span className="text-gray-600">
          {isConnected ? '🟢 Live updates' : '⚪ Updates when connected'}
        </span>
      </div>

      {/* Comments List */}
      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
        ) : (
          comments
            .filter((c) => !c.parentCommentId) // Only show top-level comments
            .map((comment) => renderComment(comment, false))
        )}
      </div>
    </div>
  );
}

// Export metadata for this component
export const metadata = {
  description: 'Real-time comment thread with replies and reactions',
};
