import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function POST(request: Request) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!auth.userId) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, targetUserEmail } = body as any;

    let targetId = targetUserId;
    
    if (targetUserEmail && !targetUserId) {
      // Find user by email
      const targetUser = await prisma.user.findUnique({
        where: { email: targetUserEmail },
        include: { player: true },
      });
      
      if (!targetUser?.player) {
        return new Response(JSON.stringify({ error: 'Target user not found' }), { status: 404 });
      }
      
      targetId = targetUser.player.userId;
    }

    if (!targetId) {
      console.error('DM Error: No targetId provided', { targetUserId, targetUserEmail });
      return new Response(JSON.stringify({ error: 'Target user ID or email is required' }), { status: 400 });
    }

    if (targetId === auth.userId) {
      return new Response(JSON.stringify({ error: 'Cannot create DM with yourself' }), { status: 400 });
    }

    // Ensure authenticated user exists before creating any player profile.
    const currentUser = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!currentUser) {
      console.error('DM Error: Authenticated user not found', { userId: auth.userId });
      return new Response(JSON.stringify({ error: 'Authenticated user not found' }), { status: 401 });
    }

    // Ensure the authenticated user has a player profile for chat participation.
    let currentUserPlayer = await prisma.player.findUnique({
      where: { userId: auth.userId },
    });

    if (!currentUserPlayer) {
      currentUserPlayer = await prisma.player.create({
        data: { userId: auth.userId },
      });
      console.log('DM Info: Created missing player profile for current user', { userId: auth.userId });
    }

    // Ensure target user exists and has a player record
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      console.error('DM Error: Target user not found', { targetId });
      return new Response(JSON.stringify({ error: 'Target user not found' }), { status: 404 });
    }

    let targetUserPlayer = await prisma.player.findUnique({
      where: { userId: targetId },
    });

    if (!targetUserPlayer) {
      targetUserPlayer = await prisma.player.create({
        data: { userId: targetId },
      });
      console.log('DM Info: Created missing player profile for target user', { targetId });
    }

    // Check if a DM room already exists between these two users
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        AND: [
          { isDM: true },
          {
            participants: {
              every: {
                playerId: { in: [auth.userId, targetId] }
              }
            }
          },
          {
            participants: {
              none: {
                playerId: { notIn: [auth.userId, targetId] }
              }
            }
          }
        ]
      },
      include: {
        participants: {
          include: {
            player: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, photo: true }
                }
              }
            }
          }
        }
      }
    });

    if (existingRoom) {
      // Return existing DM room
      const roomWithParticipants = existingRoom as any;
      const participantCount = roomWithParticipants.participants.length;
      const onlineCount = roomWithParticipants.participants.filter((p: any) => p.isOnline).length;

      return new Response(
        JSON.stringify({
          id: existingRoom.id,
          name: existingRoom.name,
          description: existingRoom.description,
          participantCount,
          onlineCount,
          isDM: true,
          participants: roomWithParticipants.participants,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create new DM room
    const newRoom = await prisma.chatRoom.create({
      data: {
        name: `DM: ${auth.userId} - ${targetId}`, // Internal name
        description: `Direct message between users`,
        isDM: true,
        createdBy: auth.userId,
        participants: {
          create: [
            {
              playerId: auth.userId,
              isOnline: true,
            },
            {
              playerId: targetId,
              isOnline: false, // Assume offline initially
            }
          ],
        },
      },
      include: {
        participants: {
          include: {
            player: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, photo: true }
                }
              }
            }
          }
        }
      }
    });

    const roomWithParticipants = newRoom as any;
    const participantCount = roomWithParticipants.participants.length;
    const onlineCount = roomWithParticipants.participants.filter((p: any) => p.isOnline).length;

    return new Response(
      JSON.stringify({
        id: newRoom.id,
        name: newRoom.name,
        description: newRoom.description,
        participantCount,
        onlineCount,
        isDM: true,
        participants: roomWithParticipants.participants,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating DM room:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}