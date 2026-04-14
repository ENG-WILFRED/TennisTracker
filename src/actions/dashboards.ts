"use server";

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

/**
 * Get coach dashboard data - student progress, training sessions, earnings
 */
export async function getCoachDashboard(coachId: string) {
  const coach = await prisma.staff.findUnique({
    where: { userId: coachId },
    include: {
      user: true,
      stats: true,
      wallet: true,
      players: {
        where: { status: 'active' },
        orderBy: { lastSessionAt: 'desc' },
        take: 6,
        include: {
          player: {
            include: { user: true },
          },
        },
      },
      activities: {
        where: {
          date: new Date().toISOString().slice(0, 10),
          completed: false,
        },
        orderBy: { startTime: 'asc' },
      },
    },
  });

  if (!coach || !coach.role.includes('Coach')) throw new Error('Coach not found');

  const studentsList = coach.players.map((rel) => ({
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
    include: {
      player: { include: { user: true } },
      court: true,
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
    ...activity,
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
    include: { user: true },
  });

  if (!referee) throw new Error('Referee not found');

  const upcomingMatches = await prisma.match.findMany({
    where: { refereeId, winnerId: null },
    include: {
      playerA: { include: { user: true } },
      playerB: { include: { user: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 5,
  });

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
    type: m.round || 'Regular Match',
  }));

  const completedMatches = await prisma.match.findMany({
    where: { refereeId, winnerId: { not: null } },
    include: {
      playerA: { include: { user: true } },
      playerB: { include: { user: true } },
      winner: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const scoreSubmissions = completedMatches.map((m) => ({
    match: `${m.playerA.user.firstName} vs ${m.playerB.user.firstName}`,
    winner: m.winner?.user.firstName || 'Unknown',
    score: m.score || 'TBD',
    date: m.createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    status: 'Submitted',
  }));

  const totalMatches = await prisma.match.count({
    where: { refereeId },
  });
  const thisMonthMatches = await prisma.match.count({
    where: {
      refereeId,
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  const incomingMatches = upcomingMatches.map((m) => ({
    id: m.id,
    playerA: `${m.playerA.user.firstName} ${m.playerA.user.lastName}`,
    playerB: `${m.playerB.user.firstName} ${m.playerB.user.lastName}`,
    eventName: m.round ? `Round ${m.round}` : 'Scheduled Match',
    status: 'upcoming',
    court: 'Court 1',
    date: m.createdAt.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  const recentMatches = completedMatches.map((m) => ({
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

  const recentTransactions = recentMatches.map((m) => ({
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
  if (!manager) throw new Error("User not found");

  console.log(`🔍 Getting dashboard for user ${manager.firstName} ${manager.lastName} (${orgManagerId}), provided orgId: ${orgId}`);

  // Get organization data - either from provided orgId or find the first organization managed by the user
  let organization = null;
  let resolvedOrgId = orgId;
  
  if (orgId) {
    organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        staff: { include: { user: true } },
        players: { include: { user: true } },
        courts: true,
        matches: true,
      },
    });
  } else {
    // Try to find an organization where this user is a staff member (manager)
    const orgStaff = await prisma.staff.findFirst({
      where: {
        userId: orgManagerId,
        role: { in: ['Manager', 'Admin', 'Owner'] },
      },
      include: {
        organization: {
          include: {
            staff: { include: { user: true } },
            players: { include: { user: true } },
            courts: true,
            matches: true,
          },
        },
      },
    });
    
    // If not found as staff, check if user is a club member with admin role
    if (!orgStaff) {
      console.log(`⚠️  No staff found, checking club members for user ${orgManagerId}...`);
      const clubMember = await prisma.clubMember.findFirst({
        where: {
          playerId: orgManagerId,
          role: { in: ['admin', 'manager', 'owner'] },
        },
        include: {
          organization: {
            include: {
              staff: { include: { user: true } },
              players: { include: { user: true } },
              courts: true,
              matches: true,
            },
          },
        },
      });
      
      if (clubMember) {
        console.log(`✅ Club member found! Organization: ${clubMember.organization.name}`);
        organization = clubMember.organization;
        resolvedOrgId = organization.id;
      } else {
        console.log(`❌ No club member found with admin role`);
      }
    } else if (orgStaff?.organization) {
      console.log(`✅ Staff found! Organization: ${orgStaff.organization.name}`);
      organization = orgStaff.organization;
      resolvedOrgId = organization.id;
    }
  }

  console.log(`📍 Resolved org ID: ${resolvedOrgId}`);

  // Get all staff
  const allStaff = await prisma.staff.findMany({
    include: { user: true },
    take: 4,
  });

  // Get upcoming matches for schedule
  const upcomingMatches = await prisma.match.findMany({
    where: { winnerId: null },
    include: {
      playerA: { include: { user: true } },
      playerB: { include: { user: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  const scheduleItems = upcomingMatches.map((m, i) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return {
      day: days[i % 7],
      time: `${10 + i}:00 AM`,
      event: `${m.playerA.user.firstName} vs ${m.playerB.user.firstName}`,
      status: i === 0 ? "Active" : "Scheduled",
    };
  });

  // Get all players for KPI
  const allPlayers = await prisma.player.findMany();
  const allCourts = await prisma.court.findMany();

  // Get members for the organization
  const members = resolvedOrgId ? await prisma.clubMember.findMany({
    where: { organizationId: resolvedOrgId },
    include: {
      player: {
        include: { user: true },
      },
      membershipTier: true,
    },
    orderBy: { joinDate: 'desc' },
  }) : [];

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
      role: "Organization Manager",
    },
    kpi: [
      { label: "Team Members", value: allPlayers.length, max: 30, color: "#7dc142" },
      { label: "Events This Month", value: 6, max: 8, color: "#a8d84e" },
      { label: "Courts Available", value: Math.floor(allCourts.length * 0.66), max: allCourts.length, color: "#3d7a32" },
      { label: "Avg Rating", value: 4.8, max: 5, color: "#f0c040" },
    ],
    schedule: scheduleItems.slice(0, 5),
    staff: allStaff.map((s) => ({
      name: `${s.user.firstName} ${s.user.lastName}`,
      role: s.role,
      status: Math.random() > 0.3 ? "Active" : "Available",
      sessions: Math.floor(Math.random() * 30) + 5,
    })),
    members: members,
    announcements: [
      {
        title: "Court Maintenance Completed",
        date: "Mar 20",
        priority: "info",
        msg: "Courts 1-3 maintenance finished",
      },
      {
        title: "New Membership Tier Available",
        date: "Mar 19",
        priority: "success",
        msg: "Platinum tier with exclusive benefits",
      },
      {
        title: "Tournament Registrations Open",
        date: "Mar 18",
        priority: "info",
        msg: "Spring Tournament · Deadline Apr 15",
      },
      {
        title: "Staff Appreciation Event",
        date: "Mar 17",
        priority: "info",
        msg: "Friday 6 PM at the pavilion",
      },
    ],
    pendingTasks: [
      { task: "Approve 3 membership requests", owner: "Admin", due: "Today", priority: "High" },
      { task: "Update event schedule", owner: "Elena", due: "Tomorrow", priority: "High" },
      { task: "Court booking system audit", owner: "James", due: "Mar 25", priority: "Medium" },
      { task: "Tournament prize distribution", owner: "Finance", due: "Mar 27", priority: "Low" },
    ],
    systemStatus: [
      { name: "Web Platform", status: "OK", uptime: "99.8%", color: "#7dc142" },
      { name: "Mobile App", status: "OK", uptime: "99.5%", color: "#7dc142" },
      { name: "Booking System", status: "Degraded", uptime: "95.2%", color: "#f0c040" },
      { name: "Analytics", status: "OK", uptime: "98.9%", color: "#7dc142" },
      { name: "Chat", status: "OK", uptime: "99.9%", color: "#7dc142" },
      { name: "API Gateway", status: "OK", uptime: "99.6%", color: "#7dc142" },
    ],
    revenueTrend: Array.from({ length: 12 }, (_, i) =>
      Math.floor(2100 + Math.random() * 2000 + i * 50)
    ),
  };
}
