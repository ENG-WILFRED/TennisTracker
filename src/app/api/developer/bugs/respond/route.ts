import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { notify } from '@/app/api/notification/producer'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, message } = body

    if (!id || !message) {
      return NextResponse.json({ error: 'Missing bug id or response message' }, { status: 400 })
    }

    const bugReport = await prisma.bugReport.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            username: true,
          }
        }
      }
    })

    if (!bugReport) {
      return NextResponse.json({ error: 'Bug report not found' }, { status: 404 })
    }

    const recipientEmail = bugReport.user?.email
    if (!recipientEmail) {
      return NextResponse.json({ error: 'Reporter email not available' }, { status: 422 })
    }

    const reporterName = `${bugReport.user.firstName || bugReport.user.username || 'User'} ${bugReport.user.lastName || ''}`.trim()

    try {
      await notify({
        to: recipientEmail,
        channel: 'email',
        template: 'bug_report_response',
        data: {
          name: reporterName,
          title: bugReport.title,
          message,
          pageUrl: bugReport.pageUrl,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (notifyError) {
      console.warn('Bug response notify failed:', notifyError)
    }

    return NextResponse.json({ success: true, message: 'Response queued for reporter', reporterEmail: recipientEmail })
  } catch (error) {
    console.error('Error sending bug response:', error)
    return NextResponse.json({ error: 'Failed to send bug response' }, { status: 500 })
  }
}
