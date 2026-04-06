import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Get or create a 1-on-1 chat room between two players
 * Query: ?player1Id=xxx&player2Id=yyy&userType=coach|player
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const player1Id = searchParams.get('player1Id');
    const player2Id = searchParams.get('player2Id');
    const userType = searchParams.get('userType');

    if (!player1Id || !player2Id) {
      return NextResponse.json(
        { error: 'Missing required params: player1Id, player2Id' },
        { status: 400 }
      );
    }

    // Ensure both users have Player records (necessary for ChatParticipant foreign key)
    const [player1, player2] = await Promise.all([
      prisma.player.findUnique({ where: { userId: player1Id } }),
      prisma.player.findUnique({ where: { userId: player2Id } }),
    ]);

    // Create Player records if they don't exist
    if (!player1) {
      await prisma.player.create({
        data: { userId: player1Id },
      });
      console.log(`✅ Created Player record for ${player1Id}`);
    }

    if (!player2) {
      await prisma.player.create({
        data: { userId: player2Id },
      });
      console.log(`✅ Created Player record for ${player2Id}`);
    }

    // Look for existing 1-on-1 room
    let room = await prisma.chatRoom.findFirst({
      where: {
        isDM: true,
        participants: {
          every: {
            playerId: {
              in: [player1Id, player2Id],
            },
          },
        },
      },
      include: {
        participants: true,
        messages: {
          take: 50,
          orderBy: { createdAt: 'asc' },
          include: {
            player: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    photo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // If no room exists, create one
    if (!room) {
      console.log(`📨 Creating new DM room between ${player1Id} and ${player2Id}`);
      
      room = await prisma.chatRoom.create({
        data: {
          name: 'Direct Message',
          isDM: true,
          isPrivate: true,
          createdBy: player1Id,
          participants: {
            createMany: {
              data: [
                { playerId: player1Id, isOnline: false },
                { playerId: player2Id, isOnline: false },
              ],
            },
          },
        },
        include: {
          participants: true,
          messages: {
            take: 50,
            orderBy: { createdAt: 'asc' },
            include: {
              player: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      photo: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Transform messages to expected format
    const messages = room.messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt,
      senderId: msg.playerId,
      senderName: `${msg.player.user.firstName} ${msg.player.user.lastName}`,
      read: !!msg.readAt,
    }));

    // Get online status of participants
    const participants = room.participants.map(p => ({
      playerId: p.playerId,
      isOnline: p.isOnline,
      lastSeen: p.lastSeen,
    }));

    console.log(`✅ Loaded room ${room.id} with ${messages.length} messages`);

    return NextResponse.json({
      roomId: room.id,
      messages,
      participants,
    });
  } catch (error) {
    console.error('Error getting or creating room:', error);
    return NextResponse.json(
      { error: 'Failed to get or create room' },
      { status: 500 }
    );
  }
}
