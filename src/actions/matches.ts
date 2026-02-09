"use server";

import { PrismaClient } from "../../src/generated/prisma";

const prisma = new PrismaClient();

/**
 * Returns player details, rank, badges, and upcoming matches for the dashboard.
 */
export async function getPlayerDashboard(playerId: string) {
  // Get player info and badges
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      playerBadges: {
        include: { badge: true },
      },
    },
  });
  if (!player) throw new Error("Player not found");

  // Calculate rank (by matchesWon, descending)
  const allPlayers = await prisma.player.findMany({
    orderBy: { matchesWon: "desc" },
    select: { id: true, matchesWon: true },
  });
  const rank =
    allPlayers.findIndex((p) => p.id === playerId) + 1;

  // Get upcoming matches (where player is A or B and winner is null)
  const matchesA = await prisma.match.findMany({
    where: { playerAId: playerId, winnerId: null },
    include: {
      playerB: true,
    },
  });
  const matchesB = await prisma.match.findMany({
    where: { playerBId: playerId, winnerId: null },
    include: {
      playerA: true,
    },
  });
  // Optionally, add referee/ball crew roles here

  // Merge and format matches
  const upcomingMatches = [
    ...matchesA.map((m) => ({
      id: m.id,
      opponent: m.playerB.firstName + ' ' + m.playerB.lastName,
      role: "Player A",
      round: m.round,
      date: m.createdAt.toISOString(),
    })),
    ...matchesB.map((m) => ({
      id: m.id,
      opponent: m.playerA.firstName + ' ' + m.playerA.lastName,
      role: "Player B",
      round: m.round,
      date: m.createdAt.toISOString(),
    })),
  ];

  // Badges
  const badges = player.playerBadges.map((pb) => ({
    id: pb.badge.id,
    name: pb.badge.name,
    description: pb.badge.description,
    icon: pb.badge.icon,
  }));

  // Get coaches (staff with Coach in their role)
  const coachesRaw = await prisma.staff.findMany({
    where: {
      role: {
        contains: "Coach",
      },
    },
    orderBy: { name: "asc" },
  });

  const coaches = coachesRaw.map((c) => ({
    id: c.id,
    firstName: c.name.split(" ")[0],
    lastName: c.name.split(" ").slice(1).join(" ") || "",
    role: c.role,
  }));

  // Get attendance records for the player
  const attendanceRaw = await prisma.attendance.findMany({
    where: { playerId },
    orderBy: { date: "asc" },
    select: {
      date: true,
      present: true,
    },
  });

  const attendance = attendanceRaw.map((a) => ({
    date: a.date.toISOString(),
    present: a.present,
  }));

  // Get inventory items from club (if club exists)
  const inventoryRaw = await prisma.inventoryItem.findMany({
    where: {
      clubId: { not: null },
    },
    select: {
      id: true,
      name: true,
      count: true,
    },
    orderBy: { name: "asc" },
    take: 20,
  });

  const inventory = inventoryRaw.map((it) => ({
    id: it.id,
    name: it.name,
    borrowed: it.count === 0,
  }));

  return {
    player: {
      id: player.id,
      username: player.username,
      email: player.email,
      phone: player.phone,
      firstName: player.firstName,
      lastName: player.lastName,
      photo: player.photo,
      gender: player.gender,
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality,
      bio: player.bio,
      matchesPlayed: player.matchesPlayed,
      matchesWon: player.matchesWon,
      matchesLost: player.matchesLost,
      matchesRefereed: player.matchesRefereed,
      matchesBallCrew: player.matchesBallCrew,
      isClub: player.isClub,
      createdAt: player.createdAt.toISOString(),
      updatedAt: player.updatedAt.toISOString(),
    },
    rank,
    badges,
    upcomingMatches,
    coaches,
    attendance,
    inventory,
  };
}

// Add this function for updating player profile
export async function updatePlayerProfile(
  playerId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    nationality?: string;
    bio?: string;
    photo?: string;
  }
) {
  // Only allow updating these fields
  await prisma.player.update({
    where: { id: playerId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      nationality: data.nationality || null,
      bio: data.bio || null,
      photo: data.photo || null,
    },
  });
}

export async function getAllPlayers() {
  return await prisma.player.findMany({
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      matchesWon: true,
      matchesPlayed: true,
    },
    orderBy: { firstName: "asc" },
  });
}

// Generate all unique pairs for round robin
export async function generateRoundRobinPairs(players: any[]) {
  const pairs = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairs.push([players[i], players[j]]);
    }
  }
  return pairs;
}

// Save matches to DB
export async function savePoolMatches(poolPairs: any[], round: number = 1) {
  const prisma = new PrismaClient();
  for (const [playerA, playerB] of poolPairs) {
    // Find a referee who is not playerA or playerB
    const referee = await prisma.player.findFirst({
      where: {
        id: { notIn: [playerA.id, playerB.id] }
      }
    });
    if (!referee) throw new Error("No available referee found");

    await prisma.match.create({
      data: {
        playerA: { connect: { id: playerA.id } },
        playerB: { connect: { id: playerB.id } },
        round,
        referee: { connect: { id: referee.id } },
      },
    });
  }
}

// Record winner and advance in knockout
export async function recordMatchWinner(matchId: string, winnerId: string) {
  const prisma = new PrismaClient();
  await prisma.match.update({
    where: { id: matchId },
    data: { winnerId },
  });
  // Optionally: advance winner in knockout tree logic here
}

/**
 * Fetch all current pool matches (where winner is not set) and their players.
 * Returns: [{ id, pool, playerA: {...}, playerB: {...}, ... }]
 */
export async function getCurrentPoolsAndMatches() {
  // Find all matches in the current round (e.g., round 1) where winner is not set
  // You can adjust the round logic as needed
  const matches = await prisma.match.findMany({
    where: { winnerId: null },
    include: {
      playerA: true,
      playerB: true,
      referee: true,
    },
    orderBy: [{ round: "asc" }, { createdAt: "asc" }],
  });

  // Optionally, group by pool if you have a pool field, or just return as is
  return matches.map((m) => ({
    id: m.id,
    pool: m.round, // or use a pool field if you have one
    playerA: m.playerA,
    playerB: m.playerB,
    referee: m.referee,
    createdAt: m.createdAt,
    // Optionally add more fields
  }));
}

/**
 * Save the winner for a pool match and update player stats.
 * @param matchId string
 * @param winnerId string
 */
export async function savePoolWinner(matchId: string, winnerId: string) {
  // Update the match with the winner
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { winnerId },
    include: { playerA: true, playerB: true },
  });

  // Update player stats
  if (match.playerAId === winnerId) {
    await prisma.player.update({
      where: { id: match.playerAId },
      data: {
        matchesWon: { increment: 1 },
        matchesPlayed: { increment: 1 },
      },
    });
    await prisma.player.update({
      where: { id: match.playerBId },
      data: {
        matchesLost: { increment: 1 },
        matchesPlayed: { increment: 1 },
      },
    });
  } else if (match.playerBId === winnerId) {
    await prisma.player.update({
      where: { id: match.playerBId },
      data: {
        matchesWon: { increment: 1 },
        matchesPlayed: { increment: 1 },
      },
    });
    await prisma.player.update({
      where: { id: match.playerAId },
      data: {
        matchesLost: { increment: 1 },
        matchesPlayed: { increment: 1 },
      },
    });
  }
}

/**
 * Get players who qualified for knockouts.
 * For example: top 8 by matchesWon, or however you define qualification.
 */
export async function getKnockoutPlayers() {
  // Example: top 8 players by matchesWon
  return await prisma.player.findMany({
    orderBy: { matchesWon: "desc" },
    take: 8,
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  });
}

/**
 * Get all knockout matches (round > 1).
 * Returns: [{ id, playerAId, playerBId, winnerId }]
 */
export async function getKnockoutMatches() {
  // Example: knockout rounds are round > 1
  return await prisma.match.findMany({
    where: { round: { gt: 1 } },
    select: {
      id: true,
      playerAId: true,
      playerBId: true,
      winnerId: true,
    },
  });
}

/**
 * Save the winner for a knockout match.
 * @param matchId string
 * @param who "a" | "b"
 */
export async function saveKnockoutScore(matchId: string, who: "a" | "b") {
  // Find match and winnerId
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { playerAId: true, playerBId: true },
  });
  if (!match) throw new Error("Match not found");
  const winnerId = who === "a" ? match.playerAId : match.playerBId;

  await prisma.match.update({
    where: { id: matchId },
    data: { winnerId },
  });

  // Optionally update player stats
  await prisma.player.update({
    where: { id: winnerId },
    data: { matchesWon: { increment: 1 }, matchesPlayed: { increment: 1 } },
  });
  const loserId = who === "a" ? match.playerBId : match.playerAId;
  await prisma.player.update({
    where: { id: loserId },
    data: { matchesLost: { increment: 1 }, matchesPlayed: { increment: 1 } },
  });
}

/**
 * Create knockout matches from player array.
 * Fills up to next power of 2 with byes (null).
 * @param players Array of player objects
 */
export async function createKnockoutMatches(players: any[]) {
  // Fill up to next power of 2 with byes (null)
  const nextPow2 = 2 ** Math.ceil(Math.log2(players.length));
  const slots = [...players];
  while (slots.length < nextPow2) slots.push(null);

  // Create matches for the first knockout round (round 2)
  for (let i = 0; i < slots.length; i += 2) {
    const playerA = slots[i];
    const playerB = slots[i + 1];
    if (playerA && playerB) {
      await prisma.match.create({
        data: {
          playerAId: playerA.id,
          playerBId: playerB.id,
          round: 2,
        },
      });
    }
    // If playerB is null, playerA gets a bye (advance logic can be handled in frontend)
  }
}

/**
 * Create knockout matches for the next round, auto-populating from previous round winners.
 * @param round The round number to create (e.g., 3 for semifinals if 2 was quarterfinals)
 */
export async function createNextKnockoutRound(round: number) {
  // Get all matches from the previous round
  const prevRoundMatches = await prisma.match.findMany({
    where: { round: round - 1 },
    orderBy: { createdAt: "asc" },
    select: { winnerId: true },
  });

  // Collect winners (skip if not all matches have a winner)
  const winners = prevRoundMatches.map((m) => m.winnerId).filter(Boolean);
  if (winners.length !== prevRoundMatches.length) {
    throw new Error("Not all previous round matches have a winner.");
  }

  // Fill up to next power of 2 with byes (null)
  const nextPow2 = 2 ** Math.ceil(Math.log2(winners.length));
  const slots = [...winners];
  while (slots.length < nextPow2) slots.push(null);

  // Create matches for this round
  for (let i = 0; i < slots.length; i += 2) {
    const playerAId = slots[i];
    const playerBId = slots[i + 1];
    if (playerAId && playerBId) {
      await prisma.match.create({
        data: {
          playerAId,
          playerBId,
          round,
        },
      });
    }
    // If playerBId is null, playerAId gets a bye (advance logic can be handled in frontend)
  }
}

/**
 * Generate next round of matches for Swiss-system (progressive round robin).
 * Each player plays someone they haven't played yet.
 * @param round The round number to create
 */
export async function createSwissNextRound(round: number) {
  // Get all players still in the tournament
  const players = await prisma.player.findMany({
    orderBy: { firstName: "asc" },
    select: { id: true, firstName: true, lastName: true },
  });

  // Get all matches so far
  const allMatches = await prisma.match.findMany({
    where: { round: { lt: round } },
    select: { playerAId: true, playerBId: true },
  });

  // Build a set of played pairs
  const played = new Set<string>();
  allMatches.forEach(m => {
    played.add([m.playerAId, m.playerBId].sort().join("-"));
  });

  // Pair players who haven't played each other yet
  const unpaired = new Set(players.map(p => p.id));
  const pairs: [string, string][] = [];
  for (let i = 0; i < players.length; i++) {
    if (!unpaired.has(players[i].id)) continue;
    for (let j = i + 1; j < players.length; j++) {
      if (!unpaired.has(players[j].id)) continue;
      const key = [players[i].id, players[j].id].sort().join("-");
      if (!played.has(key)) {
        pairs.push([players[i].id, players[j].id]);
        unpaired.delete(players[i].id);
        unpaired.delete(players[j].id);
        break;
      }
    }
  }

  // Create matches for this round
  for (const [playerAId, playerBId] of pairs) {
    await prisma.match.create({
      data: {
        playerAId,
        playerBId,
        round,
      },
    });
  }
}

/**
 * Divide players into groups and create round robin matches for each group.
 * @param players Array of player objects
 */
export async function createGroupStage(players: any[]) {
  // Shuffle players and split into 2 groups of 4
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const groupA = shuffled.slice(0, 4);
  const groupB = shuffled.slice(4, 8);

  // Save group info (optional: add a Group model/table)
  // Create round robin matches for each group
  const makePairs = (group: any[], groupName: string) => {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
         prisma.match.create({
          data: {
            playerAId: group[i].id,
            playerBId: group[j].id,
            round: 1,
            group: groupName,
          },
        });
      }
    }
  };
  await makePairs(groupA, "A");
  await makePairs(groupB, "B");
}

/**
 * Get group standings (sorted by wins, then points, etc.)
 */
export async function getGroupStandings() {
  // Get all matches in round 1 (group stage)
  const matches = await prisma.match.findMany({
    where: { round: 1 },
    include: { playerA: true, playerB: true },
  });

  // Calculate standings for each group
  const standings: any = {};
  for (const match of matches) {
    const group = match.group ?? "UNGROUPED";
    if (!standings[group]) standings[group] = {};
    [match.playerA, match.playerB].forEach((p) => {
      if (!standings[group][p.id]) {
        standings[group][p.id] = {
          player: p,
          wins: 0,
          losses: 0,
          played: 0,
        };
      }
    });
    if (match.winnerId) {
      standings[group][match.winnerId].wins += 1;
      const loserId = match.playerAId === match.winnerId ? match.playerBId : match.playerAId;
      standings[group][loserId].losses += 1;
      standings[group][match.playerAId].played += 1;
      standings[group][match.playerBId].played += 1;
    }
  }
  // Convert to sorted arrays
  for (const group in standings) {
    standings[group] = Object.values(standings[group]).sort(
      (a: any, b: any) => b.wins - a.wins
    );
  }
  return standings;
}

/**
 * Create semifinals based on group standings.
 */
export async function createSemifinalsFromGroups() {
  const standings = await getGroupStandings();
  const groupA = standings["A"];
  const groupB = standings["B"];
  if (!groupA || !groupB || groupA.length < 2 || groupB.length < 2) {
    throw new Error("Not enough players to create semifinals");
  }
  // 1st A vs 2nd B, 1st B vs 2nd A
  await prisma.match.create({
    data: {
      playerAId: groupA[0].player.id,
      playerBId: groupB[1].player.id,
      round: 2,
      group: "SF",
    },
  });
  await prisma.match.create({
    data: {
      playerAId: groupB[0].player.id,
      playerBId: groupA[1].player.id,
      round: 2,
      group: "SF",
    },
  });
}

/**
 * Create final and 3rd place playoff after semifinals.
 */
export async function createFinalsFromSemis() {
  // Get semifinals
  const semis = await prisma.match.findMany({
    where: { round: 2, group: "SF" },
  });
  if (semis.length < 2) throw new Error("Semifinals not complete");

  // Winners to final, losers to 3rd place
  const winners = semis.map((m) => m.winnerId).filter((id): id is string => !!id);
  const losers = semis.map((m) =>
    m.playerAId === m.winnerId ? m.playerBId : m.playerAId
  ).filter((id): id is string => !!id);

  if (winners.length < 2 || losers.length < 2) {
    throw new Error("Not enough valid winners or losers to create finals.");
  }

  // Final
  await prisma.match.create({
    data: {
      playerAId: winners[0],
      playerBId: winners[1],
      round: 3,
      group: "F",
    },
  });
  // 3rd place
  await prisma.match.create({
    data: {
      playerAId: losers[0],
      playerBId: losers[1],
      round: 3,
      group: "3P",
    },
  });
}

/**
 * Get leaderboard data: all players sorted by matchesWon, then totalScore.
 */
export async function getLeaderboard() {
  // Get all players and their stats
  const players = await prisma.player.findMany({
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      matchesWon: true,
      matchesPlayed: true,
    },
  });

  // Calculate total score for each player (sum of points scored in all matches)
  // If you have scoreA/scoreB fields in Match, use them. Otherwise, skip or adjust.
  const scores = await prisma.match.findMany({
    select: {
      playerAId: true,
      playerBId: true,
      score: true,
    },
  });

  const playerScores: Record<string, number> = {};
  for (const match of scores) {
    if (match.playerAId && typeof match.score === "number") {
      playerScores[match.playerAId] = (playerScores[match.playerAId] || 0) + match.score;
    }
    if (match.playerBId && typeof match.score === "number") {
      playerScores[match.playerBId] = (playerScores[match.playerBId] || 0) + match.score;
    }
  }

  // Attach totalScore to each player
  const leaderboard = players.map((p) => ({
    ...p,
    totalScore: playerScores[p.id] || 0,
  }));


  // Sort: first by matchesWon desc, then by totalScore desc
  leaderboard.sort((a, b) =>
    b.matchesWon !== a.matchesWon
      ? b.matchesWon - a.matchesWon
      : b.totalScore - a.totalScore
  );


  return leaderboard;
}

/**
 * Get detailed match info and simple comparisons for a match page.
 */
export async function getMatchDetails(matchId: string) {
  const m = await prisma.match.findUnique({
    where: { id: matchId },
    include: { playerA: true, playerB: true, referee: true },
  });
  if (!m) return null;

  // Head-to-head: count previous wins between these two players
  const aWinsAgainstB = await prisma.match.count({
    where: {
      OR: [
        { playerAId: m.playerAId, playerBId: m.playerBId, winnerId: m.playerAId },
        { playerAId: m.playerBId, playerBId: m.playerAId, winnerId: m.playerAId },
      ],
    },
  });
  const bWinsAgainstA = await prisma.match.count({
    where: {
      OR: [
        { playerAId: m.playerAId, playerBId: m.playerBId, winnerId: m.playerBId },
        { playerAId: m.playerBId, playerBId: m.playerAId, winnerId: m.playerBId },
      ],
    },
  });

  const playerAStats = await prisma.player.findUnique({
    where: { id: m.playerAId },
    select: { matchesWon: true, matchesPlayed: true, firstName: true, lastName: true },
  });
  const playerBStats = await prisma.player.findUnique({
    where: { id: m.playerBId },
    select: { matchesWon: true, matchesPlayed: true, firstName: true, lastName: true },
  });

  const winRate = (p: any) => {
    if (!p || !p.matchesPlayed) return null;
    return Math.round((p.matchesWon / Math.max(1, p.matchesPlayed)) * 100);
  };

  // Simple expectation: prefer higher win rate or more wins
  let expected: string | null = null;
  const aRate = winRate(playerAStats);
  const bRate = winRate(playerBStats);
  if (aRate != null && bRate != null) {
    if (aRate > bRate) expected = `${playerAStats?.firstName ?? ''} ${playerAStats?.lastName ?? ''}`.trim();
    else if (bRate > aRate) expected = `${playerBStats?.firstName ?? ''} ${playerBStats?.lastName ?? ''}`.trim();
  } else if (playerAStats && playerBStats) {
    expected = playerAStats.matchesWon > playerBStats.matchesWon ? `${playerAStats.firstName ?? ''} ${playerAStats.lastName ?? ''}`.trim() : `${playerBStats.firstName ?? ''} ${playerBStats.lastName ?? ''}`.trim();
  }

  return {
    id: m.id,
    round: m.round,
    score: m.score || null,
    createdAt: m.createdAt.toISOString(),
    group: m.group || null,
    playerA: {
      id: m.playerA.id,
      firstName: m.playerA.firstName,
      lastName: m.playerA.lastName,
    },
    playerB: {
      id: m.playerB.id,
      firstName: m.playerB.firstName,
      lastName: m.playerB.lastName,
    },
    referee: m.referee ? { id: m.referee.id, firstName: m.referee.firstName, lastName: m.referee.lastName } : null,
    headToHead: { aWinsAgainstB, bWinsAgainstA },
    playerAStats,
    playerBStats,
    expected,
  };
}