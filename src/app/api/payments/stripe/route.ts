import { processStripePayment } from '@/actions/payments';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { amount, currency, userId, eventId, bookingType, metadata } = payload;

    // Log incoming payload for debugging
    console.log('Stripe route received:', {
      amount: amount ? `${amount}` : 'MISSING',
      currency: currency ? currency : 'MISSING',
      userId: userId ? '***' : 'MISSING',
      eventId: eventId ? '***' : 'MISSING',
      bookingType: bookingType ? bookingType : 'MISSING',
    });

    // Validate required fields
    const errors = [];
    if (!amount || amount <= 0) errors.push('amount');
    if (!currency) errors.push('currency');
    if (!userId) errors.push('userId');
    if (!eventId) errors.push('eventId');
    if (!bookingType) errors.push('bookingType');

    if (errors.length > 0) {
      const errorMsg = `Missing required fields: ${errors.join(', ')}`;
      console.error('Stripe validation failed:', errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await processStripePayment(amount, currency, userId, eventId, bookingType, metadata);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Stripe route error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
