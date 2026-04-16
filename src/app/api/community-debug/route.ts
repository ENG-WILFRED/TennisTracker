import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Debug endpoint to check what posts exist in the database
 */
export async function GET() {
  try {
    const totalPosts = await prisma.communityPost.count();
    const totalUsers = await prisma.player.count();
    const totalFollows = await prisma.userFollower.count();
    
    // Get sample posts
    const samplePosts = await prisma.communityPost.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        likes: true,
        comments: true,
      },
    });

    // Get all users with their follower counts
    const allUsers = await prisma.player.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { followers: true, following: true },
        },
      },
      take: 5,
    });

    return NextResponse.json({
      stats: {
        totalPosts,
        totalUsers,
        totalFollows,
      },
      samplePosts: samplePosts.map((p: typeof samplePosts[number]) => ({
        id: p.id,
        authorId: p.authorId,
        authorName: `${p.author.user.firstName} ${p.author.user.lastName}`,
        content: p.content.substring(0, 50),
        createdAt: p.createdAt,
        likesCount: p.likes.length,
        commentsCount: p.comments.length,
      })),
      userFollowStats: allUsers.map((u: typeof allUsers[number]) => ({
        userId: u.userId,
        name: `${u.user.firstName} ${u.user.lastName}`,
        followers: u._count?.followers || 0,
        following: u._count?.following || 0,
      })),
      debug: {
        message: 'If totalPosts is 0, no posts exist yet. If totalFollows is 0, no one is following anyone.',
      },
    });
  } catch (error) {
    console.error('Community debug error:', error);
    return NextResponse.json(
      { error: 'Debug error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
