import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ refereeId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { refereeId } = await params;

    if (!refereeId) {
      return NextResponse.json({ error: 'Referee ID is required' }, { status: 400 });
    }

    // Verify referee exists
    const referee = await prisma.referee.findUnique({
      where: { userId: refereeId },
    });

    if (!referee) {
      return NextResponse.json({ error: 'Referee not found' }, { status: 404 });
    }

    // Mock VAR data - in a real system, this would come from a VAR model
    const varCases = [
      {
        caseId: `VAR-${refereeId.substring(0, 4)}-001`,
        match: 'Federer vs Alcaraz - Final Match',
        issue: 'Ball Line Challenge',
        status: 'Resolved',
        date: new Date(),
        time: '2:45 PM',
        decision: 'Call Confirmed',
        reviewDuration: '1m 12s',
        verdict: 'Original decision upheld',
      },
      {
        caseId: `VAR-${refereeId.substring(0, 4)}-002`,
        match: 'Medvedev vs Djokovic - Semi-Final',
        issue: 'Net Touch Query',
        status: 'Resolved',
        date: new Date(Date.now() - 86400000),
        time: '1:15 PM',
        decision: 'Call Overturned',
        reviewDuration: '1m 58s',
        verdict: 'Decision reversed based on video evidence',
      },
      {
        caseId: `VAR-${refereeId.substring(0, 4)}-003`,
        match: 'Omondi vs Hassan - Quarter-Final',
        issue: 'Double Hit Check',
        status: 'In Review',
        date: new Date(Date.now() - 172800000),
        time: '3:30 PM',
        decision: 'Pending',
        reviewDuration: '45s',
        verdict: 'Analysis ongoing',
      },
    ];

    // Calculate VAR statistics
    const totalCases = varCases.length;
    const resolvedCases = varCases.filter(c => c.status === 'Resolved').length;
    const overturnedCalls = varCases.filter(c => c.decision === 'Call Overturned').length;
    const avgReviewTime = '1m 23s';

    // Accuracy rate calculation (mock)
    const accuracyRate = ((resolvedCases - overturnedCalls) / resolvedCases * 100).toFixed(1);

    return NextResponse.json({
      activeCases: varCases.filter(c => c.status === 'In Review'),
      resolvedCases: varCases.filter(c => c.status === 'Resolved'),
      allCases: varCases,
      statistics: {
        totalVarCases: totalCases,
        overturnedCalls: overturnedCalls,
        accuracyRate: `${accuracyRate}%`,
        avgReviewTime: avgReviewTime,
        resolvedCases: resolvedCases,
      },
      recentReviews: varCases
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 3)
        .map(c => ({
          date: c.date.toLocaleDateString(),
          match: c.match,
          decision: c.decision,
          duration: c.reviewDuration,
        })),
    });
  } catch (error) {
    console.error('GET /api/referees/[id]/var-cases error:', error);
    return NextResponse.json({ error: 'Failed to fetch VAR cases' }, { status: 500 });
  }
}
