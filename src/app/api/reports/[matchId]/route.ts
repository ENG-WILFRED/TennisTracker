import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * GET /api/reports/[matchId]
 * Retrieve a match report by match ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;

    const report = await prisma.matchReport.findUnique({
      where: { matchId },
      include: {
        match: {
          include: {
            playerA: { include: { user: true } },
            playerB: { include: { user: true } },
            referee: { include: { user: true } },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: report.id,
      matchId: report.matchId,
      fileName: report.fileName,
      generatedAt: report.generatedAt,
      pdfContent: report.pdfContent, // Base64 encoded
      match: {
        playerA: report.match.playerA.user.firstName + ' ' + report.match.playerA.user.lastName,
        playerB: report.match.playerB.user.firstName + ' ' + report.match.playerB.user.lastName,
        score: report.match.score,
      },
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/[matchId]
 * Delete a match report
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;

    await prisma.matchReport.delete({
      where: { matchId },
    });

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
