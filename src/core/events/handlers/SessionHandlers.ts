/**
 * Event Handlers: React to domain events
 * 
 * Key principle: Handlers are INDEPENDENT
 * If one fails, others still run
 * No tight coupling, no cascading failures
 */

import { DomainEvent } from './DomainEvent';
import { prisma } from '@/lib/prisma';
import { notify } from '@/app/api/notification/producer';

// ─────────────────────────────────────────────────────────────────────
// HANDLER: SESSION COMPLETED → Update Player Metrics
// ─────────────────────────────────────────────────────────────────────

export async function handleSessionCompleted(event: DomainEvent): Promise<void> {
  if (event.type !== 'SESSION_COMPLETED') return;

  const { sessionId, playerId, coachId, metricsSnapshot } = event.payload;

  console.log(`[Handler] SessionCompleted → Updating metrics for ${playerId}`);

  // Fetch the session
  const session = await prisma.coachSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  // Update player metrics
  const playerMetric = await prisma.playerMetric.upsert({
    where: { playerId_organizationId: { playerId, organizationId: event.organizationId } },
    create: {
      playerId,
      organizationId: event.organizationId,
      overallScore: metricsSnapshot?.overallScore || 0,
      metricValues: metricsSnapshot || {},
    },
    update: {
      metricValues: metricsSnapshot || {},
      overallScore: metricsSnapshot?.overallScore || 0,
      updatedAt: new Date(),
    },
  });

  // Create time-series record
  await prisma.metricHistory.create({
    data: {
      playerId,
      organizationId: event.organizationId,
      sessionId,
      metricsSnapshot: metricsSnapshot || {},
      recordedAt: new Date(),
    },
  });

  console.log(`[Handler] ✓ Metrics updated for ${playerId}`);
}

// ─────────────────────────────────────────────────────────────────────
// HANDLER: SESSION COMPLETED → Record Revenue & Invoice
// ─────────────────────────────────────────────────────────────────────

export async function handleSessionCompletedPayment(event: DomainEvent): Promise<void> {
  if (event.type !== 'SESSION_COMPLETED') return;

  const { sessionId, playerId, organizationId, price } = event.payload;

  console.log(`[Handler] SessionCompleted → Recording revenue (${price} USD)`);

  // Find the player and their parent
  const player = await prisma.player.findUniqueOrThrow({
    where: { userId: playerId },
    include: { guardians: { take: 1 } },
  });

  const parentId = player.guardians[0]?.userId;

  // Record revenue
  const revenue = await prisma.orgRevenue.create({
    data: {
      organizationId,
      sessionId,
      amount: parseFloat(price),
      type: 'session',
      fromPlayerId: playerId,
      fromParentId: parentId,
      status: 'completed',
      recordedAt: new Date(),
    },
  });

  // Create or update invoice
  const invoice = await prisma.invoice.create({
    data: {
      organizationId,
      playerId,
      parentId: parentId || undefined,
      invoiceNumber: `INV-${Date.now()}`,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      totalAmount: parseFloat(price),
      paidAmount: 0,
      status: 'issued',
      lineItems: [
        {
          description: 'Coaching Session',
          sessionId,
          amount: parseFloat(price),
          date: new Date(),
        },
      ],
    },
  });

  console.log(`[Handler] ✓ Revenue recorded: ${revenue.id}`);
  console.log(`[Handler] ✓ Invoice created: ${invoice.invoiceNumber}`);
}

// ─────────────────────────────────────────────────────────────────────
// HANDLER: SESSION COMPLETED → Calculate Coach Earnings
// ─────────────────────────────────────────────────────────────────────

export async function handleSessionCompletedEarnings(event: DomainEvent): Promise<void> {
  if (event.type !== 'SESSION_COMPLETED') return;

  const { sessionId, coachId, price, platformFeePercent = 0.1 } = event.payload;

  console.log(`[Handler] SessionCompleted → Calculating coach earnings`);

  const coachEarning = parseFloat(price) * (1 - platformFeePercent);
  const platformFee = parseFloat(price) * platformFeePercent;

  // Record earning
  await prisma.coachEarning.create({
    data: {
      coachId,
      organizationId: event.organizationId,
      sessionId,
      amount: coachEarning,
      platformFee,
      status: 'pending',
      recordedAt: new Date(),
    },
  });

  // Update wallet balance
  const wallet = await prisma.coachWallet.upsert({
    where: { coachId },
    create: {
      coachId,
      balance: coachEarning,
      totalEarned: coachEarning,
      pendingBalance: coachEarning,
    },
    update: {
      balance: { increment: coachEarning },
      totalEarned: { increment: coachEarning },
      pendingBalance: { increment: coachEarning },
    },
  });

  console.log(`[Handler] ✓ Coach earning recorded: ${coachEarning} USD`);
  console.log(`[Handler] ✓ Wallet balance: ${wallet.balance} USD`);
}

// ─────────────────────────────────────────────────────────────────────
// HANDLER: SESSION COMPLETED → Send Notifications
// ─────────────────────────────────────────────────────────────────────

export async function handleSessionCompletedNotifications(event: DomainEvent): Promise<void> {
  if (event.type !== 'SESSION_COMPLETED') return;

  const { sessionId, playerId, coachId, organizationId } = event.payload;

  console.log(`[Handler] SessionCompleted → Sending notifications`);

  // Fetch entities
  const [session, player, coach] = await Promise.all([
    prisma.coachSession.findUniqueOrThrow({ where: { id: sessionId } }),
    prisma.player.findUniqueOrThrow({ where: { userId: playerId }, include: { user: true } }),
    prisma.staff.findUniqueOrThrow({ where: { userId: coachId }, include: { user: true } }),
  ]);

  // Notify player
  if (player.user?.email) {
    await notify({
      to: player.user.email,
      channel: 'email',
      template: 'session_completed_player',
      data: {
        playerName: player.user.name,
        coachName: coach.user?.name,
        sessionTitle: session.title,
      },
    });
    console.log(`[Handler] ✓ Notification sent to player: ${player.user.email}`);
  }

  // Notify coach
  if (coach.user?.email) {
    await notify({
      to: coach.user.email,
      channel: 'email',
      template: 'session_completed_coach',
      data: {
        coachName: coach.user.name,
        playerName: player.user.name,
        earning: event.payload.price,
      },
    });
    console.log(`[Handler] ✓ Notification sent to coach: ${coach.user.email}`);
  }
}

// ─────────────────────────────────────────────────────────────────────
// HANDLER: SESSION COMPLETED → Generate Recommendations
// ─────────────────────────────────────────────────────────────────────

export async function handleSessionCompletedRecommendations(event: DomainEvent): Promise<void> {
  if (event.type !== 'SESSION_COMPLETED') return;

  const { playerId, organizationId, metricsSnapshot } = event.payload;

  console.log(`[Handler] SessionCompleted → Analyzing for recommendations`);

  // Get player's metric history
  const history = await prisma.metricHistory.findMany({
    where: { playerId, organizationId },
    orderBy: { recordedAt: 'desc' },
    take: 10,
  });

  // Simple recommendation logic: if a metric is consistently low, recommend work
  const avgMetrics = history.reduce(
    (acc, h) => {
      Object.keys(h.metricsSnapshot || {}).forEach((key) => {
        acc[key] = (acc[key] || 0) + (h.metricsSnapshot?.[key] || 0);
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const recommendations: Array<{ area: string; confidence: number }> = [];

  Object.entries(avgMetrics).forEach(([metric, total]) => {
    const avg = total / history.length;
    if (avg < 50) {
      recommendations.push({
        area: metric,
        confidence: 1 - avg / 100, // Higher confidence for lower scores
      });
    }
  });

  // Create recommendations (respect guardrails)
  const config = await prisma.recommendationConfig.findUnique({
    where: { organizationId },
  });

  const maxToCreate = Math.min(
    config?.maxActivePerPlayer || 3,
    recommendations.filter((r) => r.confidence >= (config?.confidenceThreshold || 0.7))
      .length
  );

  for (let i = 0; i < maxToCreate; i++) {
    const rec = recommendations[i];
    if (!rec) break;

    await prisma.recommendation.create({
      data: {
        playerId,
        organizationId,
        focusArea: rec.area,
        confidence: rec.confidence,
        status: 'active',
        suggestedAt: new Date(),
      },
    });
  }

  console.log(`[Handler] ✓ Created ${maxToCreate} recommendations`);
}
