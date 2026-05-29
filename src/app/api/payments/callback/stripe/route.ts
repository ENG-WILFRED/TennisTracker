import { NextRequest, NextResponse } from 'next/server';
import { handlePaymentCallback } from '@/actions/payments';

export async function POST(req: NextRequest) {
  try {
    const gatewaySecret = process.env.GATEWAY_SECRET;
    const requestSecret = req.headers.get('x-gateway-secret');

    if (!gatewaySecret || !requestSecret || requestSecret !== gatewaySecret) {
      console.warn('Unauthorized internal payment event request');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const url = new URL(req.url);
    const queryData = Object.fromEntries(url.searchParams.entries());
    const data = { ...payload, ...queryData };
    console.log('Internal payment callback payload:', JSON.stringify(data, null, 2));
    const provider = String(data?.provider || '').toLowerCase();

    if (!payload || !payload.paymentId || !payload.status || !provider) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment event payload: paymentId, status, and provider are required',
        },
        { status: 400 }
      );
    }

    if (!['stripe', 'paypal', 'mpesa'].includes(provider)) {
      return NextResponse.json(
        { success: false, error: `Unsupported payment provider: ${provider}` },
        { status: 400 }
      );
    }

    const result = await handlePaymentCallback(provider as 'stripe' | 'paypal' | 'mpesa', {
      ...payload,
      transactionId: payload.paymentId,
    });

    if (result.success) {
      console.log(`✅ Payment recorded successfully: ${payload.paymentId} (${payload.status}) - ${provider}`);
    } else {
      console.error(`❌ Payment recording failed: ${payload.paymentId} - ${result.error}`);
    }

    return NextResponse.json({
      success: true,
      provider,
      paymentId: payload.paymentId,
      status: payload.status,
      result,
    });
  } catch (error) {
    console.error('Internal payment callback error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Payment callback processing failed',
      },
      { status: 500 }
    );
  }
}
