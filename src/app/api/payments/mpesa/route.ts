import { processMPesaPayment } from '@/actions/payments';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { mobileNumber, amount, accountReference, transactionDesc, userId, eventId, bookingType } = payload;

    // Log incoming payload for debugging
    console.log('M-Pesa route received:', {
      mobileNumber: mobileNumber ? '***' : 'MISSING',
      amount: amount ? `${amount}` : 'MISSING',
      userId: userId ? '***' : 'MISSING',
      eventId: eventId ? '***' : 'MISSING',
      bookingType: bookingType ? bookingType : 'MISSING',
    });

    // Validate required fields
    const errors = [];
    if (!mobileNumber) errors.push('mobileNumber');
    if (!amount || amount <= 0) errors.push('amount');
    if (!userId) errors.push('userId');
    if (!eventId) errors.push('eventId');
    if (!bookingType) errors.push('bookingType');

    if (errors.length > 0) {
      const errorMsg = `Missing required fields: ${errors.join(', ')}`;
      console.error('M-Pesa validation failed:', errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate mobile number format before calling the action
    if (!mobileNumber.match(/^254\d{9}$/)) {
      const errorMsg = 'Invalid mobile number format. Use 254XXXXXXXXX';
      console.error('M-Pesa validation failed:', errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await processMPesaPayment(mobileNumber, amount, accountReference || '', transactionDesc || '', userId, eventId, bookingType);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('M-Pesa route error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
