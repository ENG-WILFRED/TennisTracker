import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus } from '@/actions/payments';

/**
 * Get Payment Status
 * Client can poll this endpoint to check if payment has been completed
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;

    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
    }

    const result = await getPaymentStatus(transactionId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get payment status error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get payment status' },
      { status: 500 }
    );
  }
}
