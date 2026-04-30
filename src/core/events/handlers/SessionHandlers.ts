/**
 * Event Handlers: React to domain events
 * 
 * Key principle: Handlers are INDEPENDENT
 * If one fails, others still run
 * No tight coupling, no cascading failures
 */

import { DomainEvent } from '@/core/events/DomainEvent';
import prisma from '@/lib/prisma';
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
      serve: (metricsSnapshot as any)?.serve || 50,
      forehand: (metricsSnapshot as any)?.forehand || 50,
      backhand: (metricsSnapshot as any)?.backhand || 50,
      movement: (metricsSnapshot as any)?.movement || 50,
      stamina: (metricsSnapshot as any)?.stamina || 50,
      strategy: (metricsSnapshot as any)?.strategy || 50,
      mentalToughness: (metricsSnapshot as any)?.mentalToughness || 50,
      courtAwareness: (metricsSnapshot as any)?.courtAwareness || 50,
    },
    update: {
      serve: (metricsSnapshot as any)?.serve || 50,
      forehand: (metricsSnapshot as any)?.forehand || 50,
      backhand: (metricsSnapshot as any)?.backhand || 50,
      movement: (metricsSnapshot as any)?.movement || 50,
      stamina: (metricsSnapshot as any)?.stamina || 50,
      strategy: (metricsSnapshot as any)?.strategy || 50,
      mentalToughness: (metricsSnapshot as any)?.mentalToughness || 50,
      courtAwareness: (metricsSnapshot as any)?.courtAwareness || 50,
    },
  });

  // Create time-series record
  await prisma.metricHistory.create({
    data: {
      metricId: playerMetric.id,
      sessionId,
      serve: (metricsSnapshot as any)?.serve || 50,
      forehand: (metricsSnapshot as any)?.forehand || 50,
      backhand: (metricsSnapshot as any)?.backhand || 50,
      movement: (metricsSnapshot as any)?.movement || 50,
      stamina: (metricsSnapshot as any)?.stamina || 50,
      strategy: (metricsSnapshot as any)?.strategy || 50,
      mentalToughness: (metricsSnapshot as any)?.mentalToughness || 50,
      courtAwareness: (metricsSnapshot as any)?.courtAwareness || 50,
      changes: metricsSnapshot || {},
      trend: 'stable',
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

  // Record revenue
  const revenue = await prisma.orgRevenue.create({
    data: {
      organizationId,
      sessionIds: [sessionId],
      amount: parseFloat(price),
      paymentType: 'per_session',
      fromPlayerId: playerId,
      status: 'confirmed',
      recordedAt: new Date(),
      paymentMethod: 'mpesa',
    },
  });

  // Create or update invoice
  const invoice = await prisma.invoice.create({
    data: {
      organizationId,
      playerId,
      invoiceNumber: `INV-${Date.now()}`,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      totalAmount: parseFloat(price),
      paidAmount: 0,
      status: 'issued',
      lineItems: JSON.parse(JSON.stringify([
        {
          description: 'Coaching Session',
          sessionId,
          amount: parseFloat(price),
          date: new Date().toISOString(),
        },
      ])),
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

  const { sessionId, coachId, price } = event.payload;

  console.log(`[Handler] SessionCompleted → Calculating coach earnings`);

  const coachEarning = parseFloat(price) * 0.6; // 60% to coach

  // Record earning
  await prisma.coachEarning.create({
    data: {
      coachId,
      organizationId: event.organizationId,
      sessionId,
      sessionPrice: parseFloat(price),
      amount: coachEarning,
      status: 'pending',
    },
  });

  console.log(`[Handler] ✓ Coach earning recorded: ${coachEarning} for coach ${coachId}`);
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
        playerName: `${player.user.firstName} ${player.user.lastName}`,
        coachName: coach.user ? `${coach.user.firstName} ${coach.user.lastName}` : 'Coach',
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
        coachName: `${coach.user.firstName} ${coach.user.lastName}`,
        playerName: `${player.user.firstName} ${player.user.lastName}`,
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

  const { playerId, organizationId } = event.payload;

  console.log(`[Handler] SessionCompleted → Analyzing for recommendations`);

  // Create a basic recommendation
  const recommendation = await prisma.recommendation.create({
    data: {
      organizationId,
      targetId: playerId,
      targetType: 'player',
      title: 'Session Completed',
      description: 'Review session feedback and metrics',
      priority: 'medium',
      category: 'training',
      triggeredBy: 'session_analysis',
      triggerData: {},
      actionItems: [
        'Review session feedback',
        'Track progress',
      ],
      status: 'active',
    },
  });

  console.log(`[Handler] ✓ Recommendation created: ${recommendation.id}`);
}
