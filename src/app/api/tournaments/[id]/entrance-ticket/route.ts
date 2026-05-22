import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { renderTournamentEntryTicketPdf, renderTournamentEntryTicketHtml } from '@/modules/document';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID missing' }, { status: 400 });
    }

    const auth = await verifyApiAuth(request as unknown as Request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { buffer: pdfBuffer, filename } = await renderTournamentEntryTicketPdf(tournamentId, auth.userId);
      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch (renderError) {
      console.error('Error generating tournament entrance ticket PDF:', renderError);

      if (renderError instanceof Error && renderError.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      if (renderError instanceof Error && renderError.message === 'Tournament not found') {
        return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
      }

      if (renderError instanceof Error && renderError.message === 'Club membership not found') {
        return NextResponse.json({ error: 'Club membership not found' }, { status: 404 });
      }

      if (renderError instanceof Error && renderError.message === 'Registration not found') {
        return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
      }

      try {
        const { html, filename } = await renderTournamentEntryTicketHtml(tournamentId, auth.userId);
        return new NextResponse(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } catch (fallbackError) {
        console.error('Error rendering tournament ticket fallback HTML:', fallbackError);
        return NextResponse.json({ error: 'Failed to generate entrance ticket' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error generating entrance ticket:', error);
    return NextResponse.json({ error: 'Failed to generate entrance ticket' }, { status: 500 });
  }
}
