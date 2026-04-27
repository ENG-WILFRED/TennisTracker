"use server";

import prisma from '@/lib/prisma';

/**
 * Get coach dashboard data - student progress, training sessions, earnings
 */
export async function getCoachDashboard(coachId: string) {
  const coach = await prisma.staff.findUnique({
    where: { userId: coachId },
    select: {
      userId: true,
      role: true,
      bio: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          photo: true,
        },
      },
      stats: {
        select: {
          activePlayers: true,
          avgRating: true,
          totalSessions: true,
        },
      },
      wallet: {
        select: {
          totalEarned: true,
          pendingBalance: true,
          balance: true,
        },
      },
      players: {
        where: { status: 'active' },
        orderBy: { lastSessionAt: 'desc' },
        take: 6,
        select: {
          playerId: true,
          status: true,
          sessionsCount: true,
          lastSessionAt: true,
          player: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      activities: {
        where: {
          date: new Date().toISOString().slice(0, 10),
          completed: false,
        },
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          title: true,
          description: true,
          type: true,
        },
      },
    },
  });

  if (!coach) {
    console.warn(`[getCoachDashboard] No staff record found for coach: ${coachId}`);
    // Return minimal dashboard data instead of throwing
    const user = await prisma.user.findUnique({
      where: { id: coachId },
      select: { firstName: true, lastName: true, photo: true },
    });
    return {
      coach: {
        id: coachId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Coach',
        photo: user?.photo || null,
        role: 'Coach',
        bio: '',
      },
      students: [],
      nextSession: null,
      earnings: { thisMonth: 0, pending: 0, perSession: 0, balance: 0, students: 0 },
      drills: [],
      activities: [],
      stats: { studentCount: 0, rating: 0, totalSessions: 0 },
    };
  }

  if (!coach.role.includes('Coach')) {
    console.warn(`[getCoachDashboard] User ${coachId} is not a coach. Role: ${coach.role}`);
    throw new Error('User is not a coach');
  }

  const studentsList = coach.players.map((rel: any) => ({
    id: rel.playerId,
    name: `${rel.player.user.firstName} ${rel.player.user.lastName}`,
    sessions: rel.sessionsCount,
    progress: rel.sessionsCount > 0 ? Math.min(Math.round((rel.sessionsCount / 20) * 100), 100) : 0,
    lastSessionAt: rel.lastSessionAt?.toISOString() || null,
    status: rel.status,
  }));

  const upcomingSessions = await prisma.coachSession.findMany({
    where: {
      coachId,
      status: 'scheduled',
      startTime: {
        gte: new Date(),
      },
    },
    select: {
      startTime: true,
      player: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      court: {
        select: {
          courtNumber: true,
        },
      },
    },
    orderBy: { startTime: 'asc' },
    take: 3,
  });

  const nextSession = upcomingSessions[0]
    ? {
        player: `${upcomingSessions[0].player?.user.firstName ?? ''} ${upcomingSessions[0].player?.user.lastName ?? ''}`.trim(),
        date: upcomingSessions[0].startTime.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        court: upcomingSessions[0].court?.courtNumber ? `Court ${upcomingSessions[0].court.courtNumber}` : 'Court 1',
      }
    : null;

  const earnings = {
    thisMonth: coach.wallet?.totalEarned ?? 0,
    pending: coach.wallet?.pendingBalance ?? 0,
    balance: coach.wallet?.balance ?? 0,
    perSession: 60,
    students: studentsList.length,
  };

  const activities = coach.activities.map((activity) => ({
    date: activity.date,
    title: activity.title,
    description: activity.description || '',
    type: activity.type,
    dateLabel: new Date(`${activity.date}T${activity.startTime}:00Z`).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  return {
    coach: {
      id: coach.userId,
      name: `${coach.user.firstName} ${coach.user.lastName}`,
      photo: coach.user.photo,
      role: 'Coach',
      bio: coach.bio ?? '',
    },
    students: studentsList,
    nextSession,
    earnings,
    drills: [
      { name: 'Serve Technique', duration: '30 min', pct: 90, color: '#7dc142' },
      { name: 'Net Volley Practice', duration: '25 min', pct: 75, color: '#5aa832' },
      { name: 'Footwork Drills', duration: '20 min', pct: 60, color: '#3d7a32' },
      { name: 'Intensive Training', duration: '15 min', pct: 45, color: '#2d5a27' },
    ],
    activities,
    stats: {
      studentCount: coach.stats?.activePlayers ?? studentsList.length,
      rating: coach.stats?.avgRating ?? 4.6,
      totalSessions: coach.stats?.totalSessions ?? 0,
    },
  };
}

/**
 * Get referee dashboard data - upcoming matches, score submissions, stats
 */
export async function getRefereeDashboard(refereeId: string) {
  const referee = await prisma.referee.findUnique({
    where: { userId: refereeId },
    select: {
      userId: true,
      certifications: true,
      experience: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          photo: true,
        },
      },
    },
  });

  if (!referee) throw new Error('Referee not found');

  const [upcomingMatches, completedMatches, totalMatches, thisMonthMatches] = await Promise.all([
    prisma.match.findMany({
      where: { refereeId, winnerId: null },
      select: {
        id: true,
        round: true,
        createdAt: true,
        playerA: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        playerB: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        score: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    }),
    prisma.match.findMany({
      where: { refereeId, winnerId: { not: null } },
      select: {
        id: true,
        round: true,
        createdAt: true,
        score: true,
        playerA: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        playerB: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        winner: {
          select: {
            user: {
              select: {
                firstName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.match.count({
      where: { refereeId },
    }),
    prisma.match.count({
      where: {
        refereeId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  const nextMatches = upcomingMatches.slice(0, 2).map((m) => ({
    p1: m.playerA.user.firstName,
    p2: m.playerB.user.firstName,
    date: m.createdAt.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    type: `Round ${m.round}` || 'Regular Match',
  }));

  const scoreSubmissions = completedMatches.map((m: {
    playerA: { user: { firstName: string } };
    playerB: { user: { firstName: string } };
    winner?: { user: { firstName: string } } | null;
    score?: string | null;
    createdAt: Date;
  }) => ({
    match: `${m.playerA.user.firstName} vs ${m.playerB.user.firstName}`,
    winner: m.winner?.user.firstName || 'Unknown',
    score: m.score || 'TBD',
    date: m.createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    status: 'Submitted',
  }));

  const incomingMatches = upcomingMatches.map((m) => ({
    id: m.id,
    playerA: `${m.playerA.user.firstName} ${m.playerA.user.lastName}`,
    playerB: `${m.playerB.user.firstName} ${m.playerB.user.lastName}`,
    eventName: `Round ${m.round}` || 'Scheduled Match',
    status: 'upcoming',
    court: 'Court 1',
    date: m.createdAt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  const recentMatches = completedMatches.map((m: {
    playerA: { user: { firstName: string; lastName: string } };
    playerB: { user: { firstName: string; lastName: string } };
    createdAt: Date;
    score?: string | null;
  }) => ({
    player1: `${m.playerA.user.firstName} ${m.playerA.user.lastName}`,
    player2: `${m.playerB.user.firstName} ${m.playerB.user.lastName}`,
    date: m.createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    court: 'Court 1',
    score: m.score || 'TBD',
    status: 'Completed',
  }));

  return {
    referee: {
      id: referee.userId,
      name: `${referee.user.firstName} ${referee.user.lastName}`,
      photo: referee.user.photo,
      rating: 4.8,
      onTimeRate: 98,
      certifications: referee.certifications || [],
      experience: referee.experience || '',
    },
    liveMatch: {
      p1: upcomingMatches[0]?.playerA.user.firstName || 'Roger Federer',
      p2: upcomingMatches[0]?.playerB.user.firstName || 'Carlos Alcaraz',
      court: 'Court 1',
      status: upcomingMatches[0]
        ? upcomingMatches[0].createdAt.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'No live match',
    },
    nextMatches,
    incomingMatches,
    recentMatches,
    scoreSubmissions: scoreSubmissions.slice(0, 3),
    stats: {
      matchesRefereed: totalMatches,
      thisMonth: thisMonthMatches,
      rating: 4.8,
      onTimeRate: 98,
    },
  };
}

/**
 * Get admin dashboard data - members, courts, events, analytics
 */
export async function getAdminDashboard(adminId: string, orgId?: string) {
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });
  if (!admin) throw new Error("Admin not found");

  const totalOrgs = await prisma.organization.count();
  const totalUsers = await prisma.user.count();
  const activeSessions = Math.max(0, Math.floor(totalUsers * 0.18));
  const incidentCount = Math.floor(Math.random() * 3);

  const systemModules = [
    { name: 'Auth API', status: 'Healthy', uptime: '99.99%' },
    { name: 'Payments', status: 'Healthy', uptime: '99.87%' },
    { name: 'Match API', status: 'Healthy', uptime: '99.73%' },
    { name: 'Notifications', status: 'Degraded', uptime: '98.60%' },
    { name: 'Realtime Sync', status: 'Healthy', uptime: '99.91%' },
  ];

  const recentDeployments = [
    { id: 'd-321f', status: 'Success', env: 'production', updated: '14m ago' },
    { id: 'd-984a', status: 'Success', env: 'staging', updated: '2h ago' },
    { id: 'd-565e', status: 'Failed', env: 'production', updated: '8h ago' },
  ];

  return {
    admin: {
      id: admin.id,
      name: `${admin.firstName} ${admin.lastName}`,
      photo: admin.photo,
      role: 'Platform Admin',
    },
    stats: {
      totalOrganizations: totalOrgs,
      totalUsers,
      activeSessions,
      incidentCount,
      uptime: 99.92,
    },
    systemModules,
    recentDeployments,
    openIssues: incidentCount,
  };
}

/**
 * Get finance dashboard data - revenue, expenses, transactions
 */
export async function getFinanceDashboard(financeId: string) {
  const financeUser = await prisma.user.findUnique({
    where: { id: financeId },
  });
  if (!financeUser) throw new Error("User not found");

  // Get all players for membership revenue calculation
  const allPlayers = await prisma.player.findMany({
    include: { user: true },
  });

  const totalRevenue = Math.floor(
    allPlayers.length * Math.random() * 10000 + 50000
  );
  const monthlyRevenue = Math.floor(totalRevenue / 12);
  const monthlyExpenses = Math.floor(monthlyRevenue * 0.74);

  // Revenue breakdown
  const membershipFees = Math.floor(monthlyRevenue * 0.62);
  const courtBookings = Math.floor(monthlyRevenue * 0.24);
  const events = Math.floor(monthlyRevenue * 0.1);

  // Get recent transactions (matches with payments)
  const recentMatches = await prisma.match.findMany({
    include: {
      playerA: { include: { user: true } },
      playerB: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentTransactions = recentMatches.map((m: {
    playerA: { user: { firstName: string } };
    createdAt: Date | string;
  }) => ({
    member: m.playerA.user.firstName,
    type: "Match Entry",
    amount: Math.floor(Math.random() * 100) + 50,
    status: Math.random() > 0.2 ? "Paid" : Math.random() > 0.5 ? "Pending" : "Overdue",
    date: new Date(m.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  // Membership tier breakdown
  const tiers = [
    {
      name: "Gold",
      count: Math.floor(allPlayers.length * 0.3),
      fee: 120,
      color: "#f0c040",
    },
    {
      name: "Silver",
      count: Math.floor(allPlayers.length * 0.45),
      fee: 80,
      color: "#aaaaaa",
    },
    {
      name: "Bronze",
      count: allPlayers.length - Math.floor(allPlayers.length * 0.75),
      fee: 45,
      color: "#cd7f32",
    },
  ];

  const membershipTiers = tiers.map((t) => ({
    ...t,
    revenue: t.count * t.fee,
    trend: `+${Math.floor(Math.random() * 10) + 1}`,
  }));

  return {
    finance: {
      id: financeUser.id,
      name: `${financeUser.firstName} ${financeUser.lastName}`,
      photo: financeUser.photo,
      role: "Finance Officer",
    },
    stats: {
      totalRevenue,
      monthlyRevenue,
      monthlyExpenses,
      activeMembers: allPlayers.length,
      netProfit: monthlyRevenue - monthlyExpenses,
      collectionRate: 94,
    },
    revenueBreakdown: [
      { label: "Membership Fees", value: membershipFees, pct: 62 },
      { label: "Court Bookings", value: courtBookings, pct: 24 },
      { label: "Events", value: events, pct: 10 },
      {
        label: "Coaching",
        value: Math.floor(monthlyRevenue * 0.04),
        pct: 4,
      },
    ],
    membershipTiers,
    recentTransactions: recentTransactions.slice(0, 5),
    revenueData: Array.from({ length: 12 }, () =>
      Math.floor(monthlyRevenue * (0.8 + Math.random() * 0.4))
    ),
    expenseData: Array.from({ length: 12 }, () =>
      Math.floor(monthlyExpenses * (0.8 + Math.random() * 0.4))
    ),
  };
}

/**
 * Get organization dashboard data - team schedule, staff, announcements
 */
export async function getOrganizationDashboard(orgManagerId: string, orgId?: string) {
  const manager = await prisma.user.findUnique({
    where: { id: orgManagerId },
  });
  if (!manager) throw new Error('User not found');

  console.log(`🔍 Getting dashboard for user ${manager.firstName} ${manager.lastName} (${orgManagerId}), provided orgId: ${orgId}`);

  let resolvedOrgId = orgId;

  if (!resolvedOrgId) {
    const orgStaff = await prisma.staff.findFirst({
      where: {
        userId: orgManagerId,
        role: { in: ['Manager', 'Admin', 'Owner'] },
      },
      select: {
        organizationId: true,
      },
    });

    if (orgStaff?.organizationId) {
      resolvedOrgId = orgStaff.organizationId;
      console.log(`✅ Staff found! Resolved orgId: ${resolvedOrgId}`);
    }
  }

  if (!resolvedOrgId) {
    const clubMember = await prisma.clubMember.findFirst({
      where: {
        playerId: orgManagerId,
        role: { in: ['admin', 'manager', 'owner'] },
      },
      select: {
        organizationId: true,
      },
    });

    if (clubMember?.organizationId) {
      resolvedOrgId = clubMember.organizationId;
      console.log(`✅ Club member found! Resolved orgId: ${resolvedOrgId}`);
    }
  }

  if (!resolvedOrgId) {
    throw new Error('Organization not found');
  }

  console.log(`📍 Resolved org ID: ${resolvedOrgId}`);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [organizationMeta, clubMembers, memberCount, organizationStaff, upcomingEvents, announcements, financeRows, courtCount, eventsThisMonth, taskGroups, eventTaskGroups, pendingTypedTasks, pendingEventTasks] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: resolvedOrgId },
      select: {
        id: true,
        rating: true,
      },
    }),
    prisma.clubMember.findMany({
      where: { organizationId: resolvedOrgId },
      include: {
        player: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                photo: true,
                nationality: true,
                dateOfBirth: true,
              },
            },
          },
        },
        membershipTier: {
          select: { name: true },
        },
      },
      orderBy: { joinDate: 'desc' },
      take: 20,
    }),
    prisma.clubMember.count({ where: { organizationId: resolvedOrgId } }),
    prisma.staff.findMany({
      where: {
        organizationId: resolvedOrgId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.clubEvent.findMany({
      where: {
        organizationId: resolvedOrgId,
        startDate: { gt: now },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        eventType: true,
        registrationCap: true,
        entryFee: true,
        location: true,
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    }),
    prisma.clubAnnouncement.findMany({
      where: { organizationId: resolvedOrgId },
      select: {
        id: true,
        title: true,
        message: true,
        announcementType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    prisma.clubFinance.findMany({
      where: { organizationId: resolvedOrgId },
      select: {
        year: true,
        month: true,
        totalRevenue: true,
        membershipRevenue: true,
        courtBookingRevenue: true,
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    }),
    prisma.court.count({ where: { organizationId: resolvedOrgId } }),
    prisma.clubEvent.count({
      where: {
        organizationId: resolvedOrgId,
        startDate: { gte: monthStart, lt: nextMonthStart },
      },
    }),
    prisma.task.groupBy({
      by: ['assignedToId'],
      where: { organizationId: resolvedOrgId },
      _count: { _all: true },
    }).catch(() => []),
    prisma.eventTask.groupBy({
      by: ['staffUserId'],
      where: { organizationId: resolvedOrgId },
      _count: { _all: true },
    }).catch(() => []),
    prisma.task.findMany({
      where: {
        organizationId: resolvedOrgId,
        status: { not: 'COMPLETED' },
      },
      include: {
        assignedTo: { select: { user: { select: { firstName: true, lastName: true } } } },
        template: { select: { name: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 4,
    }),
    prisma.eventTask.findMany({
      where: {
        organizationId: resolvedOrgId,
        status: { not: 'COMPLETED' },
      },
      include: {
        assignedTo: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 4,
    }),
  ]);

  const scheduleItems = upcomingEvents.map((event: any) => {
    const start = new Date(event.startDate);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      eventId: event.id,
      day: days[start.getDay()],
      time: start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      event: event.name || event.eventType || 'Upcoming event',
      status: start <= now ? 'Active' : 'Scheduled',
    };
  });

  const taskCountMap: Record<string, number> = {};
  taskGroups.forEach((group: any) => {
    taskCountMap[group.assignedToId] = (taskCountMap[group.assignedToId] || 0) + group._count._all;
  });
  eventTaskGroups.forEach((group: any) => {
    taskCountMap[group.staffUserId] = (taskCountMap[group.staffUserId] || 0) + group._count._all;
  });

  const staffList = organizationStaff.map((staff: any) => ({
    name: `${staff.user.firstName} ${staff.user.lastName}`,
    role: staff.role,
    status: taskCountMap[staff.userId] > 0 ? 'Active' : 'Available',
    sessions: taskCountMap[staff.userId] || 0,
  }));

  const announcementsList = announcements.map((announcement: any) => ({
    title: announcement.title,
    date: announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    priority: announcement.announcementType || 'general',
    msg: announcement.message || announcement.title,
  }));

  const pendingTasks = [...pendingTypedTasks, ...pendingEventTasks]
    .slice(0, 4)
    .map((task: any) => ({
      id: task.id,
      source: task.template ? 'typed' : 'event',
      task: task.title || task.template?.name || 'Task',
      owner: task.assignedTo?.user ? `${task.assignedTo.user.firstName} ${task.assignedTo.user.lastName}` : 'Unassigned',
      due: task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date',
      priority: task.priority ? `${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)}` : 'Medium',
    }));

  const sortedFinances = financeRows;
  const revenueTrend = sortedFinances.map((row: any) =>
    Math.round((row.totalRevenue ?? ((row.membershipRevenue || 0) + (row.courtBookingRevenue || 0))) || 0)
  );

  const revenueTotal = revenueTrend.length > 0 ? revenueTrend[revenueTrend.length - 1] : 0;
  const revenueChange = revenueTrend.length > 1
    ? Math.round(((revenueTrend[revenueTrend.length - 1] - revenueTrend[revenueTrend.length - 2]) / Math.max(revenueTrend[revenueTrend.length - 2], 1)) * 100)
    : 0;

  const allPlayersCount = memberCount;
  const allCourtsCount = courtCount;

  const systemStatus = [
    {
      name: 'Membership',
      status: allPlayersCount > 0 ? 'Healthy' : 'Degraded',
      uptime: `${(allPlayersCount > 0 ? 99.8 : 86.2).toFixed(1)}%`,
      color: allPlayersCount > 0 ? '#7dc142' : '#f0c040',
    },
    {
      name: 'Courts',
      status: allCourtsCount > 0 ? 'Healthy' : 'Degraded',
      uptime: `${(allCourtsCount > 0 ? 99.6 : 87.1).toFixed(1)}%`,
      color: allCourtsCount > 0 ? '#7dc142' : '#f0c040',
    },
    {
      name: 'Events',
      status: eventsThisMonth > 0 ? 'Healthy' : 'Degraded',
      uptime: `${(eventsThisMonth > 0 ? 99.2 : 89.0).toFixed(1)}%`,
      color: eventsThisMonth > 0 ? '#7dc142' : '#f0c040',
    },
    {
      name: 'Tasks',
      status: pendingTasks.length > 0 ? 'Healthy' : 'Warning',
      uptime: `${(pendingTasks.length > 0 ? 98.7 : 93.5).toFixed(1)}%`,
      color: pendingTasks.length > 0 ? '#7dc142' : '#f0c040',
    },
    {
      name: 'Announcements',
      status: announcementsList.length > 0 ? 'Healthy' : 'Warning',
      uptime: `${(announcementsList.length > 0 ? 98.9 : 94.2).toFixed(1)}%`,
      color: announcementsList.length > 0 ? '#7dc142' : '#f0c040',
    },
  ];

  return {
    organizationId: resolvedOrgId,
    manager: {
      id: manager.id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      phone: manager.phone,
      photo: manager.photo,
      nationality: manager.nationality,
      gender: manager.gender,
      bio: manager.bio,
      dateOfBirth: manager.dateOfBirth,
      name: `${manager.firstName} ${manager.lastName}`,
      role: 'Organization Manager',
    },
    kpi: [
      { label: 'Team Members', value: allPlayersCount, max: Math.max(allPlayersCount, 10), color: '#7dc142' },
      { label: 'Events This Month', value: eventsThisMonth, max: Math.max(eventsThisMonth, 4), color: '#a8d84e' },
      { label: 'Courts Available', value: allCourtsCount, max: Math.max(allCourtsCount, 3), color: '#3d7a32' },
      { label: 'Avg Rating', value: Math.round((organizationMeta?.rating || 4.8) * 10) / 10, max: 5, color: '#f0c040' },
    ],
    schedule: scheduleItems,
    staff: staffList,
    members: clubMembers,
    announcements: announcementsList,
    pendingTasks,
    systemStatus,
    revenueTrend,
    revenueSummary: {
      total: revenueTotal,
      low: revenueTrend.length ? Math.min(...revenueTrend) : 0,
      changeRate: revenueChange,
    },
  };
}

