'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    createCommunityPost,
    getCommunityFeed,
    getCommunityPost,
    addPostReaction,
    removePostReaction,
    addPostComment,
    deletePostComment,
    deleteCommunityPost,
    followUser,
    unfollowUser,
    isFollowing,
    getUserFollows,
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

interface CommunityViewProps {
    onClose?: () => void;
    isEmbedded?: boolean;
}

export function CommunityView({ onClose, isEmbedded = false }: CommunityViewProps) {
    const { user: authUser } = useAuth();
    const router = useRouter();
    const params = useParams();
    const userId = authUser?.id;

    const [activeTab, setActiveTab] = useState<'feed' | 'following'>('feed');
    const [posts, setPosts] = useState<any[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
    const [expandedComments, setExpandedComments] = useState<string | null>(null);
    const [commentContent, setCommentContent] = useState('');
    const [userFollows, setUserFollows] = useState<any>(null);
    const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

    // Load feed posts
    useEffect(() => {
        const loadFeed = async () => {
            if (!userId) return;
            try {
                const postsData = await getCommunityFeed(
                    userId,
                    activeTab === 'following',
                    20,
                    0
                );
                setPosts(postsData);

                // Load user follows
                const follows = await getUserFollows(userId);
                setUserFollows(follows);
                setFollowingUsers(new Set(follows.following.map((u: any) => u.userId)));
            } catch (error: any) {
                setToast({ type: 'error', message: error.message });
            } finally {
                setLoading(false);
            }
        };

        loadFeed();
    }, [userId, activeTab]);

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) {
            setToast({ type: 'error', message: 'Please write something' });
            return;
        }

        setPosting(true);
        try {
            const newPost = await createCommunityPost(userId!, newPostContent, 'public');
            setPosts([newPost, ...posts]);
            setNewPostContent('');
            setToast({ type: 'success', message: 'Post created!' });
        } catch (error: any) {
            setToast({ type: 'error', message: error.message });
        } finally {
            setPosting(false);
        }
    };

    const handleReaction = async (postId: string, hasReacted: boolean, reactionType: string = 'like') => {
        try {
            if (hasReacted) {
                await removePostReaction(postId, userId!);
            } else {
                await addPostReaction(postId, userId!, reactionType);
            }

            // Reload posts
            const updatedPosts = await getCommunityFeed(userId!, activeTab === 'following', 20, 0);
            setPosts(updatedPosts);
        } catch (error: any) {
            setToast({ type: 'error', message: error.message });
        }
    };

    const handleAddComment = async (postId: string) => {
        if (!commentContent.trim()) return;

        try {
            await addPostComment(postId, userId!, commentContent);
            const post = await getCommunityPost(postId);
            setPosts(posts.map((p) => (p.id === postId ? post : p)));
            setCommentContent('');
            setExpandedComments(null);
        } catch (error: any) {
            setToast({ type: 'error', message: error.message });
        }
    };

    const handleDeleteComment = async (commentId: string, postId: string) => {
        try {
            await deletePostComment(commentId, userId!);
            const post = await getCommunityPost(postId);
            setPosts(posts.map((p) => (p.id === postId ? post : p)));
        } catch (error: any) {
            setToast({ type: 'error', message: error.message });
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            await deleteCommunityPost(postId, userId!);
            setPosts(posts.filter((p) => p.id !== postId));
            setToast({ type: 'success', message: 'Post deleted' });
        } catch (error: any) {
            setToast({ type: 'error', message: error.message });
        }
    };

    const handleFollowToggle = async (targetUserId: string) => {
        try {
            if (followingUsers.has(targetUserId)) {
                await unfollowUser(userId!, targetUserId);
                setFollowingUsers((prev) => {
                    const next = new Set(prev);
                    next.delete(targetUserId);
                    return next;
                });
            } else {
                await followUser(userId!, targetUserId);
                setFollowingUsers((prev) => new Set(prev).add(targetUserId));
            }
        } catch (error: any) {
            setToast({ type: 'error', message: error.message });
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
                <div style={{ color: G.muted }}>Loading community...</div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', background: isEmbedded ? 'linear-gradient(to bottom right, #0f2710, #0f1f0f, #0d1f0d)' : undefined, padding: isEmbedded ? 20 : 0, borderRadius: isEmbedded ? 8 : 0 }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: G.text, marginBottom: 6 }}>
                    👥 Community
                </h2>
                <p style={{ fontSize: 13, color: G.muted }}>
                    Share your thoughts and connect with other players
                </p>
            </div>

            {/* Create Post Section */}
            <div
                style={{
                    padding: '16px 14px',
                    background: G.card,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 8,
                    marginBottom: 24,
                }}
            >
                <div style={{ fontSize: 12, fontWeight: 700, color: G.accent, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Create Post
                </div>
                <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's on your mind? 🎾"
                    style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '12px',
                        background: G.dark,
                        border: `1px solid ${G.cardBorder}`,
                        borderRadius: 6,
                        color: G.text,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        resize: 'none',
                        marginBottom: 12,
                    }}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                        onClick={handleCreatePost}
                        disabled={posting || !newPostContent.trim()}
                        style={{
                            padding: '10px 16px',
                            background: newPostContent.trim() ? `linear-gradient(135deg, ${G.lime}, ${G.bright})` : G.mid,
                            color: '#0f1f0f',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: newPostContent.trim() ? 'pointer' : 'not-allowed',
                            opacity: newPostContent.trim() ? 1 : 0.6,
                        }}
                    >
                        {posting ? 'Posting...' : '📤 Post'}
                    </button>
                    <div style={{ fontSize: 11, color: G.muted }}>
                        {newPostContent.length}/2000
                    </div>
                    <div style={{ fontSize: 11, color: G.muted, marginLeft: 'auto' }}>
                        💬 Emoji & text supported
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: `1px solid ${G.cardBorder}` }}>
                <button
                    onClick={() => setActiveTab('feed')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'feed' ? G.lime : G.muted,
                        fontSize: 13,
                        fontWeight: 700,
                        paddingBottom: 12,
                        borderBottom: activeTab === 'feed' ? `2px solid ${G.lime}` : 'none',
                        cursor: 'pointer',
                    }}
                >
                    All Posts
                </button>
                <button
                    onClick={() => setActiveTab('following')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'following' ? G.lime : G.muted,
                        fontSize: 13,
                        fontWeight: 700,
                        paddingBottom: 12,
                        borderBottom: activeTab === 'following' ? `2px solid ${G.lime}` : 'none',
                        cursor: 'pointer',
                    }}
                >
                    Following ({userFollows?.followingCount || 0})
                </button>
            </div>

            {/* Posts Feed */}
            <div style={{ display: 'grid', gap: 12 }}>
                {posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: G.muted }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                        <div>
                            {activeTab === 'following'
                                ? 'No posts from people you follow yet'
                                : 'No posts yet. Be the first to share! 🎾'}
                        </div>
                    </div>
                ) : (
                    posts.map((post) => {
                        const userReaction = post.likes.find((r: any) => r.userId === userId);
                        const totalLikes = post.likes.length;

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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'start', flex: 1 }}>
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
                                                {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Menu */}
                                    {post.authorId === userId ? (
                                        <button
                                            onClick={() => handleDeletePost(post.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: G.red,
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                fontWeight: 600,
                                            }}
                                        >
                                            ✕
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleFollowToggle(post.authorId)}
                                            style={{
                                                padding: '4px 12px',
                                                background: followingUsers.has(post.authorId) ? G.bright : 'transparent',
                                                color: followingUsers.has(post.authorId) ? '#0f1f0f' : G.lime,
                                                border: `1px solid ${G.lime}`,
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                fontSize: 11,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {followingUsers.has(post.authorId) ? '✓ Following' : '+ Follow'}
                                        </button>
                                    )}
                                </div>

                                {/* Post Content */}
                                <div style={{ fontSize: 13, color: G.text, lineHeight: 1.5, marginBottom: 12, wordWrap: 'break-word' }}>
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
                                    <div>👍 {totalLikes} {totalLikes === 1 ? 'like' : 'likes'}</div>
                                    <div>
                                        <button onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}>
                                            💬 {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}

                                        </button>
                                    </div>
                                </div>

                                {/* Reactions */}
                                <div style={{ display: 'flex', gap: 8, paddingTop: 12, marginBottom: 12 }}>
                                    <button
                                        onClick={() => handleReaction(post.id, !!userReaction, 'like')}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            background: userReaction ? `${G.lime}30` : 'transparent',
                                            border: `1px solid ${userReaction ? G.lime : G.cardBorder}`,
                                            color: userReaction ? G.lime : G.muted,
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            fontSize: 12,
                                            fontWeight: 600,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {userReaction ? '👍 Liked' : '👍 Like'}
                                    </button>
                                    <button
                                        onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            background: expandedComments === post.id ? `${G.lime}30` : 'transparent',
                                            border: `1px solid ${expandedComments === post.id ? G.lime : G.cardBorder}`,
                                            color: expandedComments === post.id ? G.lime : G.muted,
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            fontSize: 12,
                                            fontWeight: 600,
                                        }}
                                    >
                                        💬 Comment
                                    </button>
                                    <div
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            background: 'transparent',
                                            border: `1px solid ${G.cardBorder}`,
                                            color: G.muted,
                                            borderRadius: 4,
                                            cursor: 'not-allowed',
                                            fontSize: 12,
                                            fontWeight: 600,
                                            textAlign: 'center',
                                        }}
                                    >
                                        📸 Media (coming soon)
                                    </div>
                                </div>

                                {/* Comments Section */}
                                {expandedComments === post.id && (
                                    <div
                                        style={{
                                            paddingTop: 12,
                                            borderTop: `1px solid ${G.cardBorder}`,
                                            display: 'grid',
                                            gap: 12,
                                        }}
                                    >
                                        {/* Existing Comments */}
                                        {post.comments.length > 0 && (
                                            <div style={{ display: 'grid', gap: 8 }}>
                                                {post.comments.map((comment: any) => (
                                                    <div
                                                        key={comment.id}
                                                        style={{
                                                            padding: '10px',
                                                            background: G.dark,
                                                            borderRadius: 4,
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                            <div style={{ fontWeight: 600, color: G.text }}>
                                                                {comment.author.user.firstName}
                                                            </div>
                                                            {comment.authorId === userId && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(comment.id, post.id)}
                                                                    style={{
                                                                        background: 'transparent',
                                                                        border: 'none',
                                                                        color: G.red,
                                                                        cursor: 'pointer',
                                                                        fontSize: 10,
                                                                    }}
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div style={{ color: G.text }}>{comment.content}</div>
                                                        <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>
                                                            {new Date(comment.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Comment */}
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input
                                                type="text"
                                                value={commentContent}
                                                onChange={(e) => setCommentContent(e.target.value)}
                                                placeholder="Write a comment..."
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    background: G.dark,
                                                    border: `1px solid ${G.cardBorder}`,
                                                    borderRadius: 4,
                                                    color: G.text,
                                                    fontSize: 12,
                                                }}
                                            />
                                            <button
                                                onClick={() => handleAddComment(post.id)}
                                                disabled={!commentContent.trim()}
                                                style={{
                                                    padding: '8px 12px',
                                                    background: commentContent.trim() ? G.lime : G.mid,
                                                    color: '#0f1f0f',
                                                    border: 'none',
                                                    borderRadius: 4,
                                                    cursor: commentContent.trim() ? 'pointer' : 'not-allowed',
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Send
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
