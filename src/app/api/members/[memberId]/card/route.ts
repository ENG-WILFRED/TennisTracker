import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { renderMembershipCardPdf, renderMembershipCardHtml } from '@/modules/document';

// GET: Download membership card as PDF (server-side rendering)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID missing' }, { status: 400 });
    }

    const auth = await verifyApiAuth(request as unknown as Request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { buffer: pdfBuffer, filename } = await renderMembershipCardPdf(memberId, auth.userId);
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
      console.error('Error generating membership card PDF:', renderError);

      if (renderError instanceof Error && renderError.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      if (renderError instanceof Error && renderError.message === 'Membership not found') {
        return NextResponse.json({ error: 'Membership not found or not approved' }, { status: 404 });
      }

      try {
        const { html, filename } = await renderMembershipCardHtml(memberId, auth.userId);
        return new NextResponse(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } catch (fallbackError) {
        console.error('Error rendering membership card fallback HTML:', fallbackError);
        return NextResponse.json({ error: 'Failed to generate membership card' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error generating membership card:', error);
    return NextResponse.json({ error: 'Failed to generate membership card' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 405 });
}

// Batch generation endpoint
export async function PUT(request: NextRequest) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 405 });
}