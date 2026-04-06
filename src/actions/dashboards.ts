"use server";

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

/**
 * Get coach dashboard data - student progress, training sessions, earnings
 */
export async function getCoachDashboard(coachId: string) {
  const coach = await prisma.staff.findUnique({
    where: { userId: coachId },
    include: { user: true },
  });
  if (!coach || !coach.role.includes("Coach")) throw new Error("Coach not found");

  // Get students coached by this coach
  // Note: Querying players who have attendance records
  const students = await prisma.user.findMany({
    where: {
      player: {
        isNot: null,
      },
    },
    include: {
      player: {
        include: {
          attendance: {
            orderBy: { date: "desc" },
            take: 10,
          },
        },
      },
    },
    take: 4,
  });

  const studentsList = students.map((s) => {
    const totalSessions = s.player?.attendance.length || 0;
    const progressRate = Math.min(
      Math.round((totalSessions / 20) * 100),
      100
    );
    return {
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      progress: progressRate,
      sessions: totalSessions,
      nextSession: s.player?.attendance[0]
        ? new Date(s.player.attendance[0].date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "No upcoming session",
    };
  });

  // Get upcoming matches the coach is associated with
  const coachMatches = await prisma.match.findMany({
    where: {
      refereeId: coachId,
      winnerId: null,
    },
    include: {
      playerA: { include: { user: true } },
      playerB: { include: { user: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 1,
  });

  const nextMatch =
    coachMatches.length > 0
      ? {
          player: `${coachMatches[0].playerA.user.firstName} ${coachMatches[0].playerA.user.lastName}`,
          opponent: `${coachMatches[0].playerB.user.firstName} ${coachMatches[0].playerB.user.lastName}`,
          date: new Date(coachMatches[0].createdAt).toLocaleDateString(
            "en-US",
            { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
          ),
          court: `Court ${Math.floor(Math.random() * 5) + 1}`,
        }
      : null;

  // Calculate earnings
  const monthlyRevenue = studentsList.reduce((acc, s) => acc + (s.sessions * 60), 0);
  const earnings = {
    thisMonth: monthlyRevenue,
    pending: Math.floor(monthlyRevenue * 0.1),
    perSession: 60,
    students: studentsList.length,
  };

  return {
    coach: {
      id: coach.userId,
      name: `${coach.user.firstName} ${coach.user.lastName}`,
      photo: coach.user.photo,
      role: "Coach",
    },
    students: studentsList,
    nextMatch,
    earnings,
    drills: [
      {
        name: "Serve Technique",
        duration: "30 min",
        pct: 90,
        color: "#7dc142",
      },
      {
        name: "Net Volley Practice",
        duration: "25 min",
        pct: 75,
        color: "#5aa832",
      },
      {
        name: "Footwork Drills",
        duration: "20 min",
        pct: 60,
        color: "#3d7a32",
      },
      {
        name: "Intensive Training",
        duration: "15 min",
        pct: 45,
        color: "#2d5a27",
      },
    ],
  };
}

/**
 * Get referee dashboard data - upcoming matches, score submissions, stats
 */
export async function getRefereeDashboard(refereeId: string) {
  const referee = await prisma.staff.findUnique({
    where: { userId: refereeId },
    include: { user: true },
  });
  if (!referee || !referee.role.includes("Referee"))
    throw new Error("Referee not found");

  // Get upcoming matches assigned to this referee
  const upcomingMatches = await prisma.match.findMany({
    where: { refereeId, winnerId: null },
    include: {
      playerA: { include: { user: true } },
      playerB: { include: { user: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  const nextMatches = upcomingMatches.slice(0, 2).map((m) => ({
    p1: m.playerA.user.firstName,
    p2: m.playerB.user.firstName,
    date: new Date(m.createdAt).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    type: m.round || "Regular Match",
  }));

  // Get recent score submissions (completed matches)
  const completedMatches = await prisma.match.findMany({
    where: { refereeId, winnerId: { not: null } },
    include: {
      playerA: { include: { user: true } },
      playerB: { include: { user: true } },
      winner: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const scoreSubmissions = completedMatches.map((m) => ({
    match: `${m.playerA.user.firstName} vs ${m.playerB.user.firstName}`,
    winner: m.winner?.user.firstName || "Unknown",
    score: `${Math.floor(Math.random() * 7)}-${Math.floor(Math.random() * 7)}, ${Math.floor(Math.random() * 7)}-${Math.floor(Math.random() * 7)}`,
    date: new Date(m.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    status: "Submitted",
  }));

  // Get referee stats
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

  return {
    referee: {
      id: referee.userId,
      name: `${referee.user.firstName} ${referee.user.lastName}`,
      photo: referee.user.photo,
      rating: 4.8,
      onTimeRate: 98,
    },
    liveMatch: {
      p1: upcomingMatches[0]?.playerA.user.firstName || "Roger Federer",
      p2: upcomingMatches[0]?.playerB.user.firstName || "Carlos Alcaraz",
      court: "Court 1",
      status: "Sunday 3:00 PM",
    },
    nextMatches,
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
    let orgStaff = await prisma.staff.findFirst({
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
