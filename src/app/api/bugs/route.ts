import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

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