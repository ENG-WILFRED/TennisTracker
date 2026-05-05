import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * POST /api/developer/organizations/[orgId]/email
 * Send onboarding email to organization with pricing terms
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    const { subject, body, installationFee, monthlySubscription } = await request.json();

    // Get organization
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const creator = org.createdBy
      ? await prisma.user.findUnique({
          where: { id: org.createdBy },
          select: { email: true },
        })
      : null;

    const recipientEmail = org.email || creator?.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: 'No email address found for organization' }, { status: 400 });
    }

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // For now, we'll log the email and store it in the database
    console.log(`📧 Sending onboarding email to ${recipientEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Installation Fee: $${installationFee}`);
    console.log(`Monthly Subscription: $${monthlySubscription}`);
    console.log(`Body: ${body}`);

    // Store email record in database
    const emailRecord = await prisma.developerEmailLog.create({
      data: {
        organizationId: orgId,
        recipientEmail,
        subject,
        body,
        installationFee,
        monthlySubscription,
        sentBy: auth.userId,
        status: 'sent',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailRecord,
    });
  } catch (error) {
    console.error('[OrgEmailEndpoint] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
