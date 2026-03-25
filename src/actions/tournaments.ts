'use server';

import prisma from '@/lib/prisma';
import { OrganizationActivityTracker } from '@/lib/organizationActivity';

export async function getAllTournaments() {
  try {
    const tournaments = await prisma.clubEvent.findMany({
      where: {
        eventType: {
          in: ['tournament', 'knockout', 'round_robin'],
        },
      },
      include: {
        registrations: {
          include: {
            member: {
              include: {
                player: true,
              },
            },
          },
        },
        matches: {
          include: {
            playerA: {
              include: {
                player: true,
              },
            },
            playerB: {
              include: {
                player: true,
              },
            },
          },
        },
        bracket: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return tournaments;
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }
}

export async function getTournamentStats(tournamentId: string) {
  try {
    const tournament = await prisma.clubEvent.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: true,
        matches: {
          include: {
            playerA: {
              include: {
                player: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            playerB: {
              include: {
                player: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        bracket: true,
      },
    });

    if (!tournament) {
      return null;
    }

    const totalMatches = tournament.matches.length;
    const matchesCompleted = tournament.matches.filter((m) => m.status === 'completed').length;

    // Determine tournament status
    let status = 'upcoming';
    const now = new Date();
    if (tournament.startDate <= now && (!tournament.endDate || tournament.endDate >= now)) {
      status = 'active';
    }
    if (matchesCompleted === totalMatches && totalMatches > 0) {
      status = 'completed';
    }
    if (matchesCompleted > 0 && totalMatches > 0) {
      status = 'in_progress';
    }

    // Find winner (last completed match with a winner)
    const completedMatches = tournament.matches
      .filter((m) => m.status === 'completed' && m.winnerId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    let winner = null;
    if (completedMatches.length > 0) {
      const finalMatch = completedMatches[0];
      if (finalMatch.winnerId) {
        const memberWinner = await prisma.clubMember.findUnique({
          where: { id: finalMatch.winnerId },
          include: {
            player: {
              include: {
                user: true,
              },
            },
          },
        });
        if (memberWinner?.player?.user) {
          winner = {
            firstName: memberWinner.player.user.firstName,
            lastName: memberWinner.player.user.lastName,
          };
        }
      }
    }

    return {
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      totalParticipants: tournament.registrations.length,
      matchesCompleted,
      totalMatches,
      status,
      winner,
      bracketType: tournament.bracket?.bracketType,
      prizePool: tournament.prizePool,
    };
  } catch (error) {
    console.error('Error fetching tournament stats:', error);
    return null;
  }
}

export async function getTournamentDetails(tournamentId: string) {
  try {
    const tournament = await prisma.clubEvent.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          include: {
            member: {
              include: {
                player: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        matches: {
          include: {
            playerA: {
              include: {
                player: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            playerB: {
              include: {
                player: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        organization: true,
        bracket: true,
        amenities: {
          include: {
            bookings: {
              include: {
                member: {
                  include: {
                    player: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return tournament;
  } catch (error) {
    console.error('Error fetching tournament details:', error);
    return null;
  }
}

export async function getTournamentLeaderboard(tournamentId: string) {
  try {
    const tournament = await prisma.clubEvent.findUnique({
      where: { id: tournamentId },
      include: {
        matches: {
          include: {
            playerA: true,
            playerB: true,
          },
        },
        registrations: {
          include: {
            member: {
              include: {
                player: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tournament) return null;

    // Calculate standings
    const standings = new Map<string, any>();

    tournament.registrations.forEach((reg) => {
      standings.set(reg.memberId, {
        id: reg.memberId,
        name: `${reg.member.player.user.firstName} ${reg.member.player.user.lastName}`,
        email: reg.member.player.user.email,
        photo: reg.member.player.user.photo,
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
      });
    });

    // Count matches
    tournament.matches
      .filter((m) => m.status === 'completed')
      .forEach((match) => {
        if (match.playerAId && standings.has(match.playerAId)) {
          const playerA = standings.get(match.playerAId);
          playerA.matchesPlayed += 1;
          if (match.winnerId === match.playerAId) {
            playerA.wins += 1;
          } else {
            playerA.losses += 1;
          }
        }
        if (match.playerBId && standings.has(match.playerBId)) {
          const playerB = standings.get(match.playerBId);
          playerB.matchesPlayed += 1;
          if (match.winnerId === match.playerBId) {
            playerB.wins += 1;
          } else {
            playerB.losses += 1;
          }
        }
      });

    const leaderboard = Array.from(standings.values())
      .map((player) => ({
        ...player,
        winRate: player.matchesPlayed > 0 ? Math.round((player.wins / player.matchesPlayed) * 100) : 0,
      }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.winRate - a.winRate;
      });

    return leaderboard;
  } catch (error) {
    console.error('Error fetching tournament leaderboard:', error);
    return null;
  }
}

export async function getTournamentComments(tournamentId: string) {
  try {
    const comments = await prisma.tournamentComment.findMany({
      where: {
        eventId: tournamentId,
        parentCommentId: null,
      },
      include: {
        author: {
          include: {
            user: true,
          },
        },
        replies: {
          include: {
            author: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        reactions: {
          select: {
            type: true,
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return comments.map((comment: any) => {
      // Count reactions by type
      const reactionCounts: { [key: string]: number } = {};
      let userReacted = false;
      
      comment.reactions.forEach((reaction: any) => {
        reactionCounts[reaction.type] = (reactionCounts[reaction.type] || 0) + 1;
      });

      return {
        id: comment.id,
        content: comment.content,
        authorName: `${comment.author.user.firstName} ${comment.author.user.lastName}`,
        authorEmail: comment.author.user.email,
        createdAt: comment.createdAt.toISOString(),
        reactionCounts,
        replies: comment.replies.map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          authorName: `${reply.author.user.firstName} ${reply.author.user.lastName}`,
          authorEmail: reply.author.user.email,
          createdAt: reply.createdAt.toISOString(),
        })),
      };
    });
  } catch (error) {
    console.error('Error fetching tournament comments:', error);
    return [];
  }
}

export async function addTournamentComment(tournamentId: string, content: string, userId?: string, parentCommentId?: string) {
  try {
    // If userId not provided, throw (user must be authenticated)
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const player = await prisma.player.findUnique({
      where: { userId },
    });

    if (!player) {
      throw new Error('Player profile not found');
    }

    const comment = await prisma.tournamentComment.create({
      data: {
        eventId: tournamentId,
        authorId: player.userId,
        content,
        parentCommentId,
      },
      include: {
        author: { include: { user: true } },
      },
    });

    return {
      id: comment.id,
      content: comment.content,
      authorName: `${comment.author.user.firstName} ${comment.author.user.lastName}`,
      authorEmail: comment.author.user.email,
      createdAt: comment.createdAt.toISOString(),
      replies: [],
    };
  } catch (error) {
    console.error('Error adding tournament comment:', error);
    throw error;
  }
}


export async function repplyToComment(commentId: string, content: string, userId?: string) {
  try {
    // If userId not provided, throw (user must be authenticated)
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: 'reply_' + Date.now(),
      content,
      authorName: `${user.firstName} ${user.lastName}`,
      authorEmail: user.email,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error replying to comment:', error);
    throw error;
  }
}

export async function submitTournamentInquiry(tournamentId: string, message: string, userId?: string) {
  try {
    // If userId not provided, throw (user must be authenticated)
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const tournament = await prisma.clubEvent.findUnique({
      where: { id: tournamentId },
      include: { organization: true },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Create or find an inquiry chat room
    const inquiryRoomName = `Tournament Inquiry: ${tournament.name}`;
    
    let chatRoom = await prisma.chatRoom.findFirst({
      where: {
        name: inquiryRoomName,
      },
    });

    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          name: inquiryRoomName,
          description: `Inquiry about ${tournament.name}`,
          isDM: false,
          createdBy: userId,
        },
      });
      
      // Add user as a participant
      await prisma.chatParticipant.create({
        data: {
          roomId: chatRoom.id,
          playerId: userId,
        },
      });
    }

    // Send the inquiry as a message
    await prisma.chatMessage.create({
      data: {
        roomId: chatRoom.id,
        playerId: userId,
        content: message,
      },
    });

    return {
      success: true,
      message: 'Inquiry submitted successfully',
      roomId: chatRoom.id,
    };
  } catch (error) {
    console.error('Error submitting tournament inquiry:', error);
    throw error;
  }
}

export async function applyForTournament(tournamentId: string, userId?: string) {
  try {
    // If userId not provided, throw (user must be authenticated)
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const tournament = await prisma.clubEvent.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Check if user has a player profile, if not create a basic one for tracking
    let player = await prisma.player.findUnique({
      where: { userId },
    });

    if (!player) {
      // Create a basic player profile
      player = await prisma.player.create({
        data: {
          userId,
        },
      });
    }

    // Get or create club member for this tournament's organization
    let clubMember = await prisma.clubMember.findFirst({
      where: {
        playerId: player.userId,
        organizationId: tournament.organizationId,
      },
    });

    if (!clubMember) {
      // Create club member automatically for tournament registration
      clubMember = await prisma.clubMember.create({
        data: {
          playerId: player.userId,
          organizationId: tournament.organizationId,
          role: 'member',
        },
      });

      // Track activity for organization - member joined
      await OrganizationActivityTracker.trackActivity({
        organizationId: tournament.organizationId,
        playerId: player.userId,
        action: 'member_joined',
        details: {
          joinMethod: 'tournament_registration',
          tournamentName: tournament.name,
          memberId: clubMember.id,
          joinDate: new Date().toISOString(),
        },
        metadata: {
          eventId: tournamentId,
          memberId: clubMember.id,
        },
      });
    }

    // Check if already registered
    const existing = await prisma.eventRegistration.findUnique({
      where: {
        eventId_memberId: {
          eventId: tournamentId,
          memberId: clubMember.id,
        },
      },
    });

    if (existing) {
      throw new Error('Already registered for this tournament');
    }

    // Check if tournament is at capacity
    if (tournament.registrationCap > 0) {
      const registrationCount = await prisma.eventRegistration.count({
        where: { eventId: tournamentId, status: 'registered' },
      });

      if (registrationCount >= tournament.registrationCap) {
        // Add to waitlist instead
        const waitlistPosition = await prisma.eventWaitlist.count({
          where: { eventId: tournamentId },
        });

        const waitlistEntry = await prisma.eventWaitlist.create({
          data: {
            eventId: tournamentId,
            memberId: clubMember.id,
            position: waitlistPosition + 1,
          },
        });

        // Track activity for organization
        await OrganizationActivityTracker.trackActivity({
          organizationId: tournament.organizationId,
          playerId: player.userId,
          action: 'tournament_waitlisted',
          details: {
            tournamentName: tournament.name,
            tournamentType: tournament.eventType,
            waitlistPosition: waitlistEntry.position,
            waitlistDate: new Date().toISOString(),
            waitlistId: waitlistEntry.id,
          },
          metadata: {
            eventId: tournamentId,
            memberId: clubMember.id,
          },
        });

        return {
          success: true,
          status: 'waitlisted',
          message: 'Tournament is at capacity. You have been added to the waitlist.',
          position: waitlistEntry.position,
        };
      }
    }

    // Get the highest signup order
    const latestRegistration = await prisma.eventRegistration.findFirst({
      where: { eventId: tournamentId },
      orderBy: { signupOrder: 'desc' },
    });

    const signupOrder = (latestRegistration?.signupOrder || 0) + 1;

    // Register user for tournament
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: tournamentId,
        memberId: clubMember.id,
        status: 'registered',
        signupOrder,
      },
    });

    // Track activity for organization
    await OrganizationActivityTracker.trackActivity({
      organizationId: tournament.organizationId,
      playerId: player.userId,
      action: 'tournament_registration',
      details: {
        tournamentName: tournament.name,
        tournamentType: tournament.eventType,
        registrationDate: new Date().toISOString(),
        registrationId: registration.id,
        signupOrder,
      },
      metadata: {
        eventId: tournamentId,
        memberId: clubMember.id,
      },
    });

    return {
      success: true,
      status: 'registered',
      message: 'Successfully registered for the tournament!',
      registrationId: registration.id,
    };
  } catch (error) {
    console.error('Error applying for tournament:', error);
    throw error;
  }
}

