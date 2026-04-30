import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma';
import { broadcastToDevelopers } from '@/lib/socket';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      severity,
      pageUrl,
      userAgent,
      username,
      email,
      timestamp
    } = body

    // Validate required fields
    if (!title || !description || !username || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find user by username and email
    const user = await prisma.user.findFirst({
      where: {
        username,
        email
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Save bug report to database
    const bugReport = await prisma.bugReport.create({
      data: {
        title,
        description,
        severity,
        pageUrl,
        userAgent,
        userId: user.id,
        timestamp: new Date(timestamp),
        status: 'open'
      }
    })

    // Broadcast new bug report via WebSocket in real-time
    try {
      const newBugData = {
        id: bugReport.id,
        title: bugReport.title,
        severity: bugReport.severity,
        status: bugReport.status,
        module: pageUrl ? new URL(pageUrl).pathname.split('/')[1] || 'unknown' : 'unknown',
        reporter: `${user.firstName} ${user.lastName}`,
        reporterEmail: user.email,
        pageUrl,
        userAgent,
        createdAt: bugReport.createdAt.toISOString(),
        description: description.substring(0, 100) + (description.length > 100 ? '...' : '')
      };

      broadcastToDevelopers('bug_reported', newBugData);
    } catch (broadcastError) {
      console.warn('Failed to broadcast new bug report:', broadcastError);
    }

    // Send email notifications using producer
    const { notify } = await import('@/app/api/notification/producer')

    // Email to admin
    await notify({
      to: process.env.ADMIN_EMAIL || 'admin@tennistracker.com',
      channel: 'email',
      template: 'bug_report_admin',
      data: {
        bugId: bugReport.id,
        title,
        description,
        severity,
        pageUrl,
        userAgent,
        username,
        email,
        timestamp: new Date(timestamp).toLocaleString(),
        userName: `${user.firstName} ${user.lastName}`
      }
    })

    // Email to user
    await notify({
      to: email,
      channel: 'email',
      template: 'bug_report_confirmation',
      data: {
        title,
        severity,
        userName: user.firstName
      }
    })

    return NextResponse.json({
      success: true,
      bugReport: {
        id: bugReport.id,
        title: bugReport.title,
        severity: bugReport.severity,
        status: bugReport.status,
        createdAt: bugReport.createdAt
      }
    })

  } catch (error) {
    console.error('Error saving bug report:', error)
    return NextResponse.json(
      { error: 'Failed to save bug report' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: any = {}
    if (status) where.status = status
    if (userId) where.userId = userId

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
      }
    })

    return NextResponse.json({ bugReports })

  } catch (error) {
    console.error('Error fetching bug reports:', error)
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

    return NextResponse.json({ bugReport })

  } catch (error) {
    console.error('Error updating bug report:', error)
    return NextResponse.json(
      { error: 'Failed to update bug report' },
      { status: 500 }
    )
  }
}