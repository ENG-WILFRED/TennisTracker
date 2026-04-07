import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Referee ID is required' }, { status: 400 });
    }

    // Get referee certificates
    const referee = await prisma.referee.findUnique({
      where: { userId: id },
      select: {
        certifications: true,
      },
    });

    if (!referee) {
      return NextResponse.json({ error: 'Referee not found' }, { status: 404 });
    }

    // Parse certificates from JSON strings
    const parsedCertificates = referee.certifications
      .map((cert: string) => {
        try {
          return JSON.parse(cert);
        } catch {
          return {
            name: cert,
            issued: new Date().toISOString(),
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Active',
          };
        }
      })
      .sort((a: any, b: any) => {
        // Sort by expiry date
        return new Date(a.expires).getTime() - new Date(b.expires).getTime();
      });

    // Calculate status summary
    const activeCerts = parsedCertificates.filter((c: any) => c.status === 'Active').length;
    const expiringCerts = parsedCertificates.filter((c: any) => c.status === 'Expiring Soon').length;
    const expiredCerts = parsedCertificates.filter((c: any) => c.status === 'Expired').length;

    return NextResponse.json({
      certificates: parsedCertificates,
      summary: {
        total: parsedCertificates.length,
        active: activeCerts,
        expiringSoon: expiringCerts,
        expired: expiredCerts,
      },
      nextExpiry: parsedCertificates.length > 0 ? parsedCertificates[0] : null,
    });
  } catch (error) {
    console.error('GET /api/referees/[id]/certificates error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}
