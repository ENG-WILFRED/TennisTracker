import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (status) where.status = status

    const bugReports = await prisma.bugReport.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Transform for dashboard display
    const transformed = bugReports.map((bug: typeof bugReports[number]) => ({
      id: bug.id,
      title: bug.title,
      severity: bug.severity,
      status: bug.status,
      module: bug.pageUrl ? new URL(bug.pageUrl).pathname.split('/')[1] || 'unknown' : 'unknown',
      reporter: `${bug.user.firstName} ${bug.user.lastName}`,
      reporterEmail: bug.user.email,
      pageUrl: bug.pageUrl,
      userAgent: bug.userAgent,
      createdAt: bug.createdAt.toISOString(),
      description: bug.description.substring(0, 100) + (bug.description.length > 100 ? '...' : '')
    }))

    return NextResponse.json({
      bugReports: transformed,
      total: transformed.length
    })

  } catch (error) {
    console.error('Error fetching developer bug reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bug reports' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const bugReport = await prisma.bugReport.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            username: true
          }
        }
      }
    })

    // Broadcast status update via websocket
    try {
      const broadcastResponse = await fetch('http://localhost:3001/broadcast/broadcast-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'bug_status_update',
          data: {
            id: bugReport.id,
            status: bugReport.status,
            title: bugReport.title,
            severity: bugReport.severity,
            updatedAt: new Date().toISOString()
          }
        })
      })
    } catch (broadcastError) {
      console.warn('Failed to broadcast bug status update:', broadcastError)
    }

    return NextResponse.json({
      bugReport: {
        id: bugReport.id,
        title: bugReport.title,
        severity: bugReport.severity,
        status: bugReport.status,
        updatedAt: bugReport.updatedAt
      }
    })

  } catch (error) {
    console.error('Error updating bug report:', error)
    return NextResponse.json(
      { error: 'Failed to update bug report' },
      { status: 500 }
    )
  }
}