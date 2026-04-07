import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * GET /api/reports?refereeId=xxx
 * List all reports for a referee
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const refereeId = searchParams.get('refereeId');

    if (!refereeId) {
      return NextResponse.json(
        { error: 'Missing refereeId parameter' },
        { status: 400 }
      );
    }

    const reports = await prisma.matchReport.findMany({
      where: { refereeId },
      include: {
        match: {
          include: {
            playerA: { include: { user: true } },
            playerB: { include: { user: true } },
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });

    const mappedReports = reports.map(report => ({
      id: report.id,
      matchId: report.matchId,
      fileName: report.fileName,
      generatedAt: report.generatedAt,
      playerA: `${report.match.playerA.user.firstName} ${report.match.playerA.user.lastName}`,
      playerB: `${report.match.playerB.user.firstName} ${report.match.playerB.user.lastName}`,
      score: report.match.score || 'TBD',
    }));

    return NextResponse.json({
      total: mappedReports.length,
      reports: mappedReports,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
