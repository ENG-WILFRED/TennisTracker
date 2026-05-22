import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { renderBookingGatepassPdf, renderBookingGatepassHtml } from '@/modules/document';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID missing' }, { status: 400 });
    }

    const auth = await verifyApiAuth(request as unknown as Request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { buffer: pdfBuffer, filename } = await renderBookingGatepassPdf(bookingId, auth.userId);

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
      console.error('Error generating booking gatepass PDF:', renderError);

      if (renderError instanceof Error && renderError.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      if (renderError instanceof Error && renderError.message === 'Booking not found') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      try {
        const { html, filename } = await renderBookingGatepassHtml(bookingId, auth.userId);
        return new NextResponse(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } catch (fallbackError) {
        console.error('Error rendering gatepass fallback HTML:', fallbackError);
        return NextResponse.json({ error: 'Failed to generate booking gatepass' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error generating booking gatepass:', error);
    return NextResponse.json({ error: 'Failed to generate booking gatepass' }, { status: 500 });
  }
}
