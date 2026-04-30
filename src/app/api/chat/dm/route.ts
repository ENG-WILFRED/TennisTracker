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
      return new Response(JSON.stringify({ error: 'Target user ID or email is required' }), { status: 400 });
    }

    if (targetId === auth.userId) {
      return new Response(JSON.stringify({ error: 'Cannot create DM with yourself' }), { status: 400 });
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

    // Get target user info for room name
    const targetUser = await prisma.player.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'Target user not found' }), { status: 404 });
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