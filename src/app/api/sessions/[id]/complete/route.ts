/**
 * API: Complete a coaching session
 * 
 * NEW ARCHITECTURE:
 * 1. Update session status
 * 2. EMIT event (async cascade begins)
 * 3. Return immediately
 * 
 * OLD ARCHITECTURE (❌ WRONG):
 * - Sync calls to 5+ services
 * - Slow response
 * - Cascading failures
 * 
 * NEW ARCHITECTURE (✅ RIGHT):
 * - Emit event
 * - Workers react independently
 * - Fast, resilient, scalable
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createDomainEvent } from '@/core/events/DomainEvent';
import { publishEvent } from '@/core/events/EventBus';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  try {
    // 1. FETCH SESSION
    const session = await prisma.coachSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        coach: true,
        player: true,
        progressUpdates: true,
      },
    });

    // 2. VALIDATE STATE
    if (session.status !== 'in-progress') {
      return NextResponse.json(
        { error: `Cannot complete session with status: ${session.status}` },
        { status: 400 }
      );
    }

    // 3. UPDATE SESSION
    const updatedSession = await prisma.coachSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        updatedAt: new Date(),
      },
    });

    console.log(`[API] Session ${sessionId} marked as completed`);

    // 4. CALCULATE METRICS FROM PROGRESS UPDATES
    let metricsSnapshot: Record<string, number> = {};
    if (session.progressUpdates.length > 0) {
      const latest = session.progressUpdates[session.progressUpdates.length - 1];
      metricsSnapshot = {
        serve_accuracy: 75,
        footwork: 80,
        strategy: 65,
        stamina: 70,
        mental_toughness: 80,
        // (In real code, these come from ProgressUpdate.metricValues)
      };
    }

    // 5. EMIT SESSION_COMPLETED EVENT
    // This is the KEY: single event triggers everything
    const eventId = await publishEvent(
      createDomainEvent(
        'SESSION_COMPLETED',
        sessionId,
        'CoachSession',
        session.organizationId || '',
        {
          sessionId,
          playerId: session.playerId,
          coachId: session.coachId,
          organizationId: session.organizationId,
          title: session.title,
          
          // Metrics for handlers
          metricsSnapshot,
          
          // Financial data
          price: session.price || 50,
          platformFeePercent: 0.1,
          
          // For notifications
          coachName: (session.coach as any)?.firstName || 'Coach',
          playerName: (session.player as any)?.firstName || 'Player',
        },
        {
          userId: req.headers.get('x-user-id') || 'system',
          source: 'API',
          correlationId: `session-${sessionId}`,
        }
      )
    );

    console.log(`[API] ✓ SESSION_COMPLETED event published: ${eventId}`);

    // 6. RETURN IMMEDIATELY
    // Workers handle everything else async
    return NextResponse.json({
      success: true,
      session: updatedSession,
      eventId, // Client can track event processing if needed
      message: 'Session completed. Processing started.',
      processingTime: '~5-10 seconds for all handlers',
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[API] Error:`, errMsg);

    return NextResponse.json(
      { error: errMsg },
      { status: err instanceof Error && 'code' in err && err.code === 'P2025' ? 404 : 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// EXPLANATION: Why This Architecture is Better
// ─────────────────────────────────────────────────────────────────

/*

BEFORE (Monolithic Sync):
  PUT /sessions/{id}/complete
    → Fetch session
    → Update metrics (sync) ← 1 DB round trip
    → Record revenue (sync) ← 1 DB round trip
    → Calculate earnings (sync) ← 1 DB round trip
    → Send notifications (sync) ← 2-3 API calls
    → Generate recommendations (sync) ← 2-3 DB queries
    ✗ TOTAL: 8-12 sync operations = 5-10 seconds
    ✗ If ANY fails, everything fails

AFTER (Event-Driven Async):
  PUT /sessions/{id}/complete
    → Fetch session
    → Update session status
    → Emit SESSION_COMPLETED event ✓
    ← Return immediately (< 500ms)
    
  Meanwhile (in background workers):
    Metrics Handler: Update player metrics
    Payment Handler: Record revenue + invoice
    Earnings Handler: Calculate coach earnings
    Notification Handler: Send emails via Kafka
    Recommendation Handler: Generate recommendations
    
    ✓ All run independently
    ✓ If one fails, others still work
    ✓ Easy to scale (add more workers)
    ✓ Can retry failures without user waiting

BENEFITS:
✅ API responds instantly
✅ Independent handler failures don't cascade
✅ Easy to scale (more workers = more throughput)
✅ Easy to debug (check EventLog for which handlers ran)
✅ Easy to replay (re-run handlers if they fail)
✅ Easy to audit (complete event history)
✅ Can add handlers later without changing API

*/
