import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * GET /api/messaging/contacts?userId=xxx&roles=coach,player,referee&userType=coach|player|referee
 * 
 * Get all users in the database with their roles and message data.
 * Supports filtering by role and sorting by recent contact + unread messages.
 * 
 * Query params:
 * - userId: current user ID
 * - userType: user type (coach, player, referee)
 * - roles: comma-separated roles to filter by (player, coach, referee, admin)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');
    const rolesFilter = searchParams.get('roles'); // comma-separated

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required param: userId' },
        { status: 400 }
      );
    }

    // Parse roles filter
    const roleFilters = rolesFilter ? rolesFilter.split(',').map(r => r.trim().toLowerCase()) : [];

    // Get all users except the current user
    const allUsers = await prisma.user.findMany({
      where: {
        id: { not: userId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        photo: true,
        player: { select: { userId: true, organizationId: true } },
        staff: { select: { userId: true, role: true } },
        referee: { select: { userId: true } },
        spectator: { select: { userId: true } },
      },
    });

    // Map users with their roles
    type UserWithRole = {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      photo: string | null;
      roles: string[];
      lastMessageTime: Date | null;
      lastMessageContent: string;
      unreadCount: number;
      isOnline: boolean;
    };

    const usersWithRoles: UserWithRole[] = allUsers.map((user) => {
      const roles: Set<string> = new Set();
      if (user.player) roles.add('player');
      if (user.staff) roles.add('coach');
      if (user.referee) roles.add('referee');
      if (user.spectator && roles.size === 0) roles.add('admin');
      if (roles.size === 0) roles.add('admin');

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        photo: user.photo,
        roles: Array.from(roles),
        lastMessageTime: null,
        lastMessageContent: 'No messages yet',
        unreadCount: 0,
        isOnline: false,
      };
    });

    // Apply role filter if provided
    let filteredUsers = usersWithRoles;
    if (roleFilters.length > 0) {
      filteredUsers = usersWithRoles.filter((user) =>
        user.roles.some((role) => roleFilters.includes(role))
      );
    }

    // Get last message and unread count for each user from chat rooms
    if (filteredUsers.length > 0) {
      // Get all DM chat rooms involving the current user
      const chatRooms = await prisma.chatRoom.findMany({
        where: {
          isDM: true,
          participants: {
            some: {
              playerId: userId,
            },
          },
        },
        include: {
          participants: {
            select: { playerId: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      // Create a map of user IDs to their last messages and unread counts
      const messageDataMap = new Map<string, { lastMessageTime: Date | null; lastMessageContent: string; unreadCount: number }>();

      for (const room of chatRooms) {
        // Find the other participant ID (not the current user)
        const otherUserId = room.participants.find((p) => p.playerId !== userId)?.playerId;
        if (!otherUserId) continue;

        const lastMessage = room.messages[0];
        const lastMessageTime = lastMessage ? lastMessage.createdAt : null;
        const lastMessageContent = lastMessage
          ? lastMessage.content.length > 50
            ? lastMessage.content.substring(0, 50) + '...'
            : lastMessage.content
          : 'No messages yet';

        // Count unread messages from the other user
        const unreadCount = await prisma.chatMessage.count({
          where: {
            roomId: room.id,
            playerId: otherUserId,
            readAt: null,
          },
        });

        messageDataMap.set(otherUserId, { lastMessageTime, lastMessageContent, unreadCount });
      }

      // Update users with message data
      filteredUsers = filteredUsers.map((user) => {
        const messageData = messageDataMap.get(user.id);
        return {
          ...user,
          lastMessageTime: messageData?.lastMessageTime || null,
          lastMessageContent: messageData?.lastMessageContent || 'No messages yet',
          unreadCount: messageData?.unreadCount || 0,
        };
      });
    }

    // Fetch online status for all users (single query instead of N queries)
    if (filteredUsers.length > 0) {
      const userIds = filteredUsers.map(u => u.id);
      const latestStatuses = await prisma.chatParticipant.findMany({
        where: { playerId: { in: userIds } },
        select: { playerId: true, isOnline: true },
        distinct: ['playerId'],
        orderBy: { lastSeen: 'desc' },
      });

      const statusMap = new Map(latestStatuses.map(s => [s.playerId, s.isOnline]));
      filteredUsers = filteredUsers.map(user => ({
        ...user,
        isOnline: statusMap.get(user.id) ?? false,
      }));
    }

    // Sort by: unread count (desc), then by last message time (desc), then by name
    filteredUsers.sort((a, b) => {
      // First, sort by unread count (descending)
      if (a.unreadCount !== b.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }

      // Then, sort by last message time (most recent first)
      if (a.lastMessageTime && b.lastMessageTime) {
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      }

      // Users with messages come before those without
      if (a.lastMessageTime && !b.lastMessageTime) return -1;
      if (!a.lastMessageTime && b.lastMessageTime) return 1;

      // Finally, sort by name
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json(filteredUsers);
  } catch (error) {
    console.error('Error fetching messaging contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
