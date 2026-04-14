import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  broadcastToClients,
  broadcastExcept,
} from '@/lib/websocket-broadcast';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    if (false) { // TODO: Implement auth check
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (action === 'feed') {
      // Get feed for current user (posts from people they follow + own posts)
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = 10;
      const skip = (page - 1) * pageSize;
      const organizationId = searchParams.get('organizationId');

      let whereClause: any;

      if (organizationId) {
        whereClause = {
          visibility: 'public',
          organizationId,
        };
      } else {
        const followedUserIds = await prisma.userFollower
          .findMany({
            where: { followerId: userId },
            select: { followingId: true },
          })
          .then((follows: Array<{ followingId: string }>) => follows.map((f) => f.followingId));

        whereClause = {
          OR: [
            { authorId: userId },
            { authorId: { in: followedUserIds } },
          ],
        };
      }

      const feedPosts = await prisma.communityPost.findMany({
        where: whereClause,
        include: {
          author: {
            include: {
              user: {
                select: { id: true, email: true, firstName: true, lastName: true, photo: true },
              },
            },
          },
          comments: {
            include: {
              author: {
                include: {
                  user: {
                    select: { id: true, email: true, firstName: true, lastName: true, photo: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          likes: {
            select: { userId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      });

      const totalPosts = await prisma.communityPost.count({
        where: whereClause,
      });

      const feedWithMeta = feedPosts.map((post: typeof feedPosts[number]) => ({
        ...post,
        comments: post.comments,
        reactions: post.likes,
        commentCount: post.comments.length,
        reactionCount: post.likes.length,
        userHasLiked: post.likes.some((r: typeof post.likes[number]) => r.userId === userId),
      }));

      return NextResponse.json({
        posts: feedWithMeta,
        pagination: {
          page,
          pageSize,
          total: totalPosts,
          pages: Math.ceil(totalPosts / pageSize),
        },
      });
    }

    if (action === 'explore') {
      // Get all posts with good engagement for discovery
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = 10;
      const skip = (page - 1) * pageSize;

      const allPosts = await prisma.communityPost.findMany({
        where: { visibility: 'public' },
        include: {
          author: {
            include: {
              user: {
                select: { id: true, email: true, firstName: true, lastName: true, photo: true },
              },
            },
          },
          comments: {
            include: {
              author: {
                include: {
                  user: {
                    select: { id: true, email: true, firstName: true, lastName: true, photo: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          likes: {
            select: { userId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      });

      const totalPosts = await prisma.communityPost.count({
        where: { visibility: 'public' },
      });

      const exploreWithMeta = allPosts.map((post: { comments: string | any[]; likes: any[]; }) => ({
        ...post,
        commentCount: post.comments.length,
        reactionCount: post.likes.length,
        userHasLiked: post.likes.some((r: { userId: string; }) => r.userId === userId),
      }));

      return NextResponse.json({
        posts: exploreWithMeta,
        pagination: {
          page,
          pageSize,
          total: totalPosts,
          pages: Math.ceil(totalPosts / pageSize),
        },
      });
    }

    if (action === 'followers') {
      // Get followers of a user
      const targetUserId = searchParams.get('userId') || userId;

      const followers = await prisma.userFollower.findMany({
        where: { followingId: targetUserId },
        include: {
          follower: {
            include: {
              user: {
                select: { id: true, email: true, firstName: true, lastName: true, photo: true },
              },
            },
          },
        },
      });

      return NextResponse.json({ followers: followers.map((f: { follower: any; }) => f.follower) });
    }

    if (action === 'following') {
      // Get users that someone is following
      const targetUserId = searchParams.get('userId') || userId;

      const following = await prisma.userFollower.findMany({
        where: { followerId: targetUserId },
        include: {
          following: {
            include: {
              user: {
                select: { id: true, email: true, firstName: true, lastName: true, photo: true },
              },
            },
          },
        },
      });

      return NextResponse.json({ following: following.map((f: { following: any; }) => f.following) });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Community API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data, userId } = await request.json();

    if (false) { // TODO: Implement auth check
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (action === 'create-post') {
      const { content, visibility, organizationId } = data;

      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'Content cannot be empty' },
          { status: 400 }
        );
      }

      const postData: any = {
        authorId: userId,
        content: content.trim(),
        visibility: visibility || 'public',
      };
      if (organizationId) {
        postData.organizationId = organizationId;
      }

      const post = await prisma.communityPost.create({
        data: postData,
        include: {
          author: {
            include: {
              user: {
                select: { id: true, email: true, firstName: true, lastName: true, photo: true },
              },
            },
          },
          comments: {
            include: {
              author: {
                include: {
                  user: {
                    select: { id: true, email: true, firstName: true, lastName: true, photo: true },
                  },
                },
              },
            },
          },
          likes: {
            select: { userId: true },
          },
        },
      });

      const postWithMeta = {
        ...post,
        commentCount: post.comments.length,
        reactionCount: post.likes.length,
        userHasLiked: false,
      };

      // Broadcast to all connected clients
      broadcastToClients({
        type: 'post-created',
        data: postWithMeta,
      });

      return NextResponse.json(postWithMeta, { status: 201 });
    }

    if (action === 'delete-post') {
      const { postId } = data;

      // Verify ownership
      const post = await prisma.communityPost.findUnique({
        where: { id: postId },
      });

      if (!post || post.authorId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await prisma.communityPost.delete({ where: { id: postId } });
      return NextResponse.json({ success: true });
    }

    if (action === 'add-comment') {
      const { postId, content } = data;

      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'Comment cannot be empty' },
          { status: 400 }
        );
      }

      const comment = await prisma.postComment.create({
        data: {
          postId,
          authorId: userId,
          content: content.trim(),
        },
        include: {
          author: {
            include: {
              user: {
                select: { id: true, email: true, firstName: true, lastName: true, photo: true },
              },
            },
          },
        },
      });

      // Broadcast comment to all clients
      broadcastToClients({
        type: 'comment-added',
        data: {
          comment,
          postId,
        },
      });

      return NextResponse.json(comment, { status: 201 });
    }

    if (action === 'delete-comment') {
      const { commentId } = data;

      // Verify ownership
      const comment = await prisma.postComment.findUnique({
        where: { id: commentId },
      });

      if (!comment || comment.authorId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await prisma.postComment.delete({ where: { id: commentId } });
      return NextResponse.json({ success: true });
    }

    if (action === 'like-post') {
      const { postId } = data;

      // Check if already liked
      const existingReaction = await prisma.postReaction.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: userId,
          },
        },
      });

      if (existingReaction) {
        // Unlike
        await prisma.postReaction.delete({
          where: {
            postId_userId: {
              postId,
              userId: userId,
            },
          },
        });

        // Broadcast unlike event
        broadcastToClients({
          type: 'post-liked',
          data: {
            postId,
            userId: userId,
            action: 'unliked',
          },
        });

        return NextResponse.json({ action: 'unliked' });
      }

      // Like
      const reaction = await prisma.postReaction.create({
        data: {
          postId,
          userId: userId,
          type: 'like',
        },
      });

      // Broadcast like event
      broadcastToClients({
        type: 'post-liked',
        data: {
          postId,
          userId: userId,
          action: 'liked',
          reaction,
        },
      });

      return NextResponse.json({ action: 'liked', reaction });
    }

    if (action === 'reply-to-comment') {
      const { commentId, content } = data;

      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'Reply content cannot be empty' },
          { status: 400 }
        );
      }

      // Verify parent comment exists
      const parentComment = await prisma.postComment.findUnique({
        where: { id: commentId },
      });

      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }

      // Create reply as a new PostComment with parentCommentId
      const reply = await prisma.postComment.create({
        data: {
          postId: parentComment.postId,
          authorId: userId,
          content: content.trim(),
          parentCommentId: commentId,
        },
        include: {
          author: {
            include: {
              user: {
                select: { id: true, email: true, firstName: true, lastName: true, photo: true },
              },
            },
          },
        },
      });

      // Broadcast reply to all clients
      broadcastToClients({
        type: 'comment-reply-added',
        data: {
          reply,
          parentCommentId: commentId,
          postId: parentComment.postId,
        },
      });

      return NextResponse.json(reply, { status: 201 });
    }

    if (action === 'react-to-comment') {
      const { commentId, reactionType } = data;
      const type = reactionType || 'like';

      // Check if already reacted
      const existingReaction = await prisma.commentReaction.findUnique({
        where: {
          commentId_userId: {
            commentId,
            userId: userId,
          },
        },
      });

      if (existingReaction) {
        // Remove reaction (toggle)
        await prisma.commentReaction.delete({
          where: {
            commentId_userId: {
              commentId,
              userId: userId,
            },
          },
        });

        // Broadcast reaction removal
        broadcastToClients({
          type: 'comment-reaction-removed',
          data: {
            commentId,
            userId: userId,
            reactionType: type,
          },
        });

        return NextResponse.json({ action: 'reaction-removed' });
      }

      // Add reaction
      const reaction = await prisma.commentReaction.create({
        data: {
          commentId,
          userId: userId,
          type,
        },
      });

      // Broadcast reaction added
      broadcastToClients({
        type: 'comment-reaction-added',
        data: {
          reaction,
          commentId,
          userId: userId,
          reactionType: type,
        },
      });

      return NextResponse.json({ action: 'reaction-added', reaction }, { status: 201 });
    }

    if (action === 'follow') {
      const { userId: targetUserId } = data;

      if (targetUserId === userId) {
        return NextResponse.json(
          { error: 'Cannot follow yourself' },
          { status: 400 }
        );
      }

      // Check if already following
      const existingFollow = await prisma.userFollower.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });

      if (existingFollow) {
        // Unfollow
        await prisma.userFollower.delete({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: targetUserId,
            },
          },
        });
        return NextResponse.json({ action: 'unfollowed' });
      }

      // Follow
      const follow = await prisma.userFollower.create({
        data: {
          followerId: userId,
          followingId: targetUserId,
        },
      });

      return NextResponse.json({ action: 'followed', follow }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Community API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
