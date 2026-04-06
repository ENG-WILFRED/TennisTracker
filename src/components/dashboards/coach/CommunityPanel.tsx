'use client';

import React, { useEffect, useState } from 'react';
import { useCommunityUpdates } from '@/hooks/useCommunityWebSocket';
import {
  getCommunityPost,
  addPostReaction,
  removePostReaction,
  addPostComment,
  deletePostComment,
} from '@/actions/community';

const G = {
  dark: '#0f1f0f',
  sidebar: '#152515',
  card: '#1a3020',
  cardBorder: '#2d5a35',
  mid: '#2d5a27',
  bright: '#3d7a32',
  lime: '#7dc142',
  accent: '#a8d84e',
  text: '#e8f5e0',
  muted: '#7aaa6a',
  yellow: '#f0c040',
  red: '#dc2626',
};

interface Comment {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  author: {
    user: {
      firstName: string;
    };
  };
}

interface PostLike {
  id: string;
  userId: string;
}

interface CommunityPost {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: {
    user: {
      firstName: string;
      lastName: string;
      photo?: string;
    };
  };
  comments: Comment[];
  likes: PostLike[];
}

export default function CommunityPanel({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState<{ [postId: string]: string }>({});
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [posting, setPosting] = useState(false);

  // WebSocket setup for real-time updates
  const isConnected = useCommunityUpdates(
    undefined, // onPostCreated
    (comment) => {
      // New comment added
      setPosts((prev) =>
        prev.map((post) =>
          post.id === comment.postId
            ? {
                ...post,
                comments: [...post.comments, comment],
              }
            : post
        )
      );
      showToast('New comment added', 'success');
    },
    undefined, // onCommentReplyAdded
    undefined, // onCommentReactionAdded
    undefined, // onCommentReactionRemoved
    (data) => {
      // Post liked
      setPosts((prev) =>
        prev.map((post) =>
          post.id === data.postId
            ? { ...post, likes: data.likes || post.likes }
            : post
        )
      );
    }
  );

  // Fetch feed
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch(`/api/community?action=feed&userId=${userId}`);

        if (res.ok) {
          const data = await res.json();
          let postsList: any[] = Array.isArray(data) ? data : data?.posts || [];
          setPosts(postsList);
        }
      } catch (error) {
        console.error('Error fetching feed:', error);
        showToast('Failed to load feed', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchFeed();
    }
  }, [userId]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      const hasLiked = post?.likes.some((like) => like.userId === userId);

      if (hasLiked) {
        await removePostReaction(postId, userId);
      } else {
        await addPostReaction(postId, userId, 'like');
      }

      // Refresh post
      const updatedPost = await getCommunityPost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? (updatedPost as unknown as CommunityPost) : p))
      );
    } catch (error) {
      console.error('Error handling like:', error);
      showToast('Failed to update like', 'error');
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = commentContent[postId];
    if (!content?.trim()) return;

    try {
      setPosting(true);
      await addPostComment(postId, userId, content);
      
      // Refresh post to get updated comments
      const updatedPost = await getCommunityPost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? (updatedPost as unknown as CommunityPost) : p))
      );
      
      setCommentContent({ ...commentContent, [postId]: '' });
      showToast('Comment added!', 'success');
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('Failed to add comment', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    try {
      await deletePostComment(commentId, userId);

      // Refresh post
      const updatedPost = await getCommunityPost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? (updatedPost as unknown as CommunityPost) : p))
      );
      
      showToast('Comment deleted', 'success');
    } catch (error) {
      console.error('Delete comment error:', error);
      showToast('Failed to delete comment', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: G.muted }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
        <div>Loading community feed...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: G.text, marginBottom: 6 }}>
          👥 Community Feed {isConnected ? '🟢' : '⚪'}
        </h2>
        <p style={{ fontSize: 13, color: G.muted }}>
          Connect with your players and other coaches
        </p>
      </div>

      {/* Posts Feed */}
      <div style={{ display: 'grid', gap: 12 }}>
        {posts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: G.muted,
              background: G.card,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div>No posts yet. Follow some players to see their updates! 🎾</div>
          </div>
        ) : (
          posts.map((post) => {
            const userLike = post.likes.find((r) => r.userId === userId);
            const totalLikes = post.likes.length;
            const hasExpandedComments = expandedComments === post.id;

            return (
              <div
                key={post.id}
                style={{
                  padding: '16px 14px',
                  background: G.card,
                  border: `1px solid ${G.cardBorder}`,
                  borderRadius: 8,
                }}
              >
                {/* Post Header */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'start', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${G.lime}, ${G.bright})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                      color: '#0f1f0f',
                      fontWeight: 700,
                    }}
                  >
                    {post.author.user.firstName?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: G.text }}>
                      {post.author.user.firstName} {post.author.user.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>
                      {new Date(post.createdAt).toLocaleDateString()} at{' '}
                      {new Date(post.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div
                  style={{
                    fontSize: 13,
                    color: G.text,
                    lineHeight: 1.5,
                    marginBottom: 12,
                    wordWrap: 'break-word',
                  }}
                >
                  {post.content}
                </div>

                {/* Engagement Stats */}
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: 11,
                    color: G.muted,
                    paddingBottom: 12,
                    borderBottom: `1px solid ${G.cardBorder}`,
                  }}
                >
                  <div>
                    👍 {totalLikes} {totalLikes === 1 ? 'like' : 'likes'}
                  </div>
                  <button
                    onClick={() =>
                      setExpandedComments(
                        hasExpandedComments ? null : post.id
                      )
                    }
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: G.muted,
                      cursor: 'pointer',
                      fontSize: 11,
                      padding: 0,
                    }}
                  >
                    💬 {post.comments.length}{' '}
                    {post.comments.length === 1 ? 'comment' : 'comments'}
                  </button>
                </div>

                {/* Reactions */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 12, marginBottom: 12 }}>
                  <button
                    onClick={() => handleLike(post.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: userLike ? `${G.lime}30` : 'transparent',
                      border: `1px solid ${userLike ? G.lime : G.cardBorder}`,
                      color: userLike ? G.lime : G.muted,
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    {userLike ? '👍 Liked' : '👍 Like'}
                  </button>
                  <button
                    onClick={() =>
                      setExpandedComments(
                        hasExpandedComments ? null : post.id
                      )
                    }
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: hasExpandedComments ? `${G.lime}30` : 'transparent',
                      border: `1px solid ${
                        hasExpandedComments ? G.lime : G.cardBorder
                      }`,
                      color: hasExpandedComments ? G.lime : G.muted,
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    💬 Comment
                  </button>
                </div>

                {/* Comments Section */}
                {hasExpandedComments && (
                  <div
                    style={{
                      paddingTop: 12,
                      borderTop: `1px solid ${G.cardBorder}`,
                      display: 'grid',
                      gap: 10,
                    }}
                  >
                    {/* Existing Comments */}
                    {post.comments.length > 0 && (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            style={{
                              padding: '10px',
                              background: G.dark,
                              borderRadius: 4,
                              fontSize: 11,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 4,
                              }}
                            >
                              <div style={{ fontWeight: 600, color: G.text }}>
                                {comment.author?.user?.firstName ||
                                  'Anonymous'}
                              </div>
                              {comment.authorId === userId && (
                                <button
                                  onClick={() =>
                                    handleDeleteComment(comment.id, post.id)
                                  }
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: G.red,
                                    cursor: 'pointer',
                                    fontSize: 10,
                                    padding: 0,
                                  }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <div
                              style={{
                                color: G.text,
                                marginBottom: 4,
                                wordBreak: 'break-word',
                              }}
                            >
                              {comment.content}
                            </div>
                            <div style={{ fontSize: 9, color: G.muted }}>
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Input */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={commentContent[post.id] || ''}
                        onChange={(e) =>
                          setCommentContent({
                            ...commentContent,
                            [post.id]: e.target.value,
                          })
                        }
                        placeholder="Write a comment..."
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          background: G.dark,
                          border: `1px solid ${G.cardBorder}`,
                          borderRadius: 4,
                          color: G.text,
                          fontSize: 11,
                          outline: 'none',
                          fontFamily: 'inherit',
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={
                          posting || !commentContent[post.id]?.trim()
                        }
                        style={{
                          padding: '8px 12px',
                          background:
                            commentContent[post.id]?.trim() && !posting
                              ? G.lime
                              : G.mid,
                          color: '#0f1f0f',
                          border: 'none',
                          borderRadius: 4,
                          cursor:
                            commentContent[post.id]?.trim() && !posting
                              ? 'pointer'
                              : 'not-allowed',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {posting ? '...' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            padding: '12px 16px',
            background: toast.type === 'success' ? G.bright : G.red,
            color: '#0f1f0f',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            zIndex: 1000,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
