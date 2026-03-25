"use server";

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

/**
 * Create a new community post
 */
export async function createCommunityPost(
  authorId: string,
  content: string,
  visibility: string = "public",
  tournamentId?: string
) {
  try {
    if (!content.trim()) {
      throw new Error("Post content cannot be empty");
    }

    if (content.length > 2000) {
      throw new Error("Post content is too long (max 2000 characters)");
    }

    // Ensure the user has a Player record
    const player = await prisma.player.findUnique({
      where: { userId: authorId },
    });

    if (!player) {
      // Create a Player record for this user
      await prisma.player.create({
        data: {
          userId: authorId,
        },
      });
    }

    let post;

    if (tournamentId) {
      // Check if user already shared this tournament
      const existingPost = await prisma.communityPost.findFirst({
        where: {
          authorId,
          tournamentId,
          type: 'tournament_share',
        },
      });

      if (existingPost) {
        // Increment share count and update content
        const newShareCount = existingPost.shareCount + 1;
        const updatedContent = content.replace(/shared \d+ times?/i, `shared ${newShareCount} times`);

        post = await prisma.communityPost.update({
          where: { id: existingPost.id },
          data: {
            content: updatedContent,
            shareCount: newShareCount,
            updatedAt: new Date(),
          },
          include: {
            author: {
              include: {
                user: true,
              },
            },
            likes: true,
            comments: true,
          },
        });
      } else {
        // Create new share post
        post = await prisma.communityPost.create({
          data: {
            authorId,
            content,
            visibility,
            type: 'tournament_share',
            tournamentId,
            shareCount: 1,
          },
          include: {
            author: {
              include: {
                user: true,
              },
            },
            likes: true,
            comments: true,
          },
        });
      }
    } else {
      // Regular post
      post = await prisma.communityPost.create({
        data: {
          authorId,
          content,
          visibility,
        },
        include: {
          author: {
            include: {
              user: true,
            },
          },
          likes: true,
          comments: true,
        },
      });
    }

    return post;
  } catch (error: any) {
    throw new Error(`Failed to create post: ${error.message}`);
  }
}

/**
 * Get feed posts (all posts or filtered by followers)
 */
export async function getCommunityFeed(
  userId: string,
  includeFollowersOnly: boolean = false,
  limit: number = 20,
  offset: number = 0
) {
  try {
    let whereCondition: any = { visibility: "public" };

    if (includeFollowersOnly) {
      // Get posts from users you follow and your own posts
      const userFollowing = await prisma.userFollower.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });

      const followingIds = userFollowing.map((f) => f.followingId);
      followingIds.push(userId); // Include own posts

      whereCondition = {
        OR: [
          { authorId: { in: followingIds }, visibility: "public" },
          { authorId: { in: followingIds }, visibility: "followers-only" },
          {
            authorId: userId,
            visibility: { in: ["public", "followers-only", "private"] },
          },
        ],
      };
    }

    const posts = await prisma.communityPost.findMany({
      where: whereCondition,
      include: {
        author: {
          include: {
            user: true,
          },
        },
        likes: {
          select: {
            id: true,
            userId: true,
            type: true,
          },
        },
        comments: {
          include: {
            author: {
              include: {
                user: true,
              },
            },
          },
          take: 5, // Limit comments in feed
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    return posts;
  } catch (error: any) {
    throw new Error(`Failed to fetch feed: ${error.message}`);
  }
}

/**
 * Get a single post with all comments
 */
export async function getCommunityPost(postId: string) {
  try {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: {
            user: true,
          },
        },
        likes: {
          select: {
            id: true,
            userId: true,
            type: true,
          },
        },
        comments: {
          include: {
            author: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    return post;
  } catch (error: any) {
    throw new Error(`Failed to fetch post: ${error.message}`);
  }
}

/**
 * Delete a community post (only author or admin)
 */
export async function deleteCommunityPost(postId: string, userId: string) {
  try {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== userId) {
      throw new Error("You can only delete your own posts");
    }

    await prisma.communityPost.delete({
      where: { id: postId },
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }
}

/**
 * Add a reaction to a post
 */
export async function addPostReaction(
  postId: string,
  userId: string,
  reactionType: string = "like"
) {
  try {
    // Check if post exists
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    // Ensure the user has a Player record
    const player = await prisma.player.findUnique({
      where: { userId },
    });

    if (!player) {
      // Create a Player record for this user
      await prisma.player.create({
        data: {
          userId,
        },
      });
    }

    // Upsert reaction (update if exists, create if not)
    const reaction = await prisma.postReaction.upsert({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
      update: {
        type: reactionType,
      },
      create: {
        postId,
        userId,
        type: reactionType,
      },
    });

    return reaction;
  } catch (error: any) {
    throw new Error(`Failed to add reaction: ${error.message}`);
  }
}

/**
 * Remove a reaction from a post
 */
export async function removePostReaction(postId: string, userId: string) {
  try {
    await prisma.postReaction.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to remove reaction: ${error.message}`);
  }
}

/**
 * Add a comment to a post
 */
export async function addPostComment(
  postId: string,
  authorId: string,
  content: string
) {
  try {
    if (!content.trim()) {
      throw new Error("Comment cannot be empty");
    }

    if (content.length > 500) {
      throw new Error("Comment is too long (max 500 characters)");
    }

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    // Ensure the user has a Player record
    const player = await prisma.player.findUnique({
      where: { userId: authorId },
    });

    if (!player) {
      // Create a Player record for this user
      await prisma.player.create({
        data: {
          userId: authorId,
        },
      });
    }

    const comment = await prisma.postComment.create({
      data: {
        postId,
        authorId,
        content,
      },
      include: {
        author: {
          include: {
            user: true,
          },
        },
      },
    });

    return comment;
  } catch (error: any) {
    throw new Error(`Failed to add comment: ${error.message}`);
  }
}

/**
 * Delete a comment (only author)
 */
export async function deletePostComment(commentId: string, userId: string) {
  try {
    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.authorId !== userId) {
      throw new Error("You can only delete your own comments");
    }

    await prisma.postComment.delete({
      where: { id: commentId },
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to delete comment: ${error.message}`);
  }
}

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string) {
  try {
    if (followerId === followingId) {
      throw new Error("You cannot follow yourself");
    }

    // Ensure both users have Player records
    const [followerPlayer, followingPlayer] = await Promise.all([
      prisma.player.findUnique({
        where: { userId: followerId },
      }),
      prisma.player.findUnique({
        where: { userId: followingId },
      }),
    ]);

    if (!followerPlayer) {
      await prisma.player.create({
        data: { userId: followerId },
      });
    }

    if (!followingPlayer) {
      await prisma.player.create({
        data: { userId: followingId },
      });
    }

    const follow = await prisma.userFollower.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      update: {},
      create: {
        followerId,
        followingId,
      },
    });

    return follow;
  } catch (error: any) {
    throw new Error(`Failed to follow user: ${error.message}`);
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string) {
  try {
    await prisma.userFollower.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to unfollow user: ${error.message}`);
  }
}

/**
 * Get user's followers and following
 */
export async function getUserFollows(userId: string) {
  try {
    const [followers, following] = await Promise.all([
      prisma.userFollower.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photo: true,
                },
              },
            },
          },
        },
      }),
      prisma.userFollower.findMany({
        where: { followerId: userId },
        include: {
          following: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photo: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      followers: followers.map((f) => f.follower),
      following: following.map((f) => f.following),
      followerCount: followers.length,
      followingCount: following.length,
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch follows: ${error.message}`);
  }
}

/**
 * Check if user follows another user
 */
export async function isFollowing(followerId: string, followingId: string) {
  try {
    const follow = await prisma.userFollower.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  } catch (error: any) {
    throw new Error(`Failed to check follow status: ${error.message}`);
  }
}

/**
 * Get user's community posts
 */
export async function getUserPosts(userId: string, limit: number = 10) {
  try {
    const posts = await prisma.communityPost.findMany({
      where: { authorId: userId },
      include: {
        author: {
          include: {
            user: true,
          },
        },
        likes: {
          select: {
            id: true,
            userId: true,
            type: true,
          },
        },
        comments: {
          take: 3,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return posts;
  } catch (error: any) {
    throw new Error(`Failed to fetch user posts: ${error.message}`);
  }
}
