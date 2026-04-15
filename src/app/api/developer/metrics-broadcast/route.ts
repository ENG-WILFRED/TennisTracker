import { NextRequest, NextResponse } from 'next/server'
import { broadcastToDevelopers } from '@/lib/socket'

/**
 * Internal endpoint to broadcast metrics to connected developers
 * Called periodically from the server to push updates via WebSocket
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (from the server itself)
    const authHeader = request.headers.get('authorization')
    const internalToken = process.env.INTERNAL_API_TOKEN || 'internal-broadcast-token'
    
    if (authHeader !== `Bearer ${internalToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { metrics } = await request.json()
    
    if (!metrics) {
      return NextResponse.json(
        { error: 'Metrics data required' },
        { status: 400 }
      )
    }

    // Broadcast metrics to all connected developers
    broadcastToDevelopers('developer_metrics_update', metrics)

    return NextResponse.json({ 
      success: true,
      message: 'Metrics broadcast to developers'
    })
  } catch (error) {
    console.error('Error in metrics broadcast:', error)
    return NextResponse.json(
      { error: 'Failed to broadcast metrics' },
      { status: 500 }
    )
  }
}
