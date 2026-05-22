import prisma from '@/lib/prisma';
import { uploadToStorage } from '@/lib/storage';
import {
  buildMembershipCardTemplate,
  buildGatepassTemplate,
  buildTournamentEntryTemplate,
  generatePDFCardHtmlString,
  generateQRCodeDataUrl,
  renderPdfFromHtml,
} from '@document-kit';

const formatDate = (date: Date | string): string => {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTimeRange = (start: Date, end?: Date): string => {
  const startTime = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (!end) {
    return startTime;
  }
  return `${startTime} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

export async function renderMembershipCardPdf(
  memberId: string,
  currentUserId: string
): Promise<{ buffer: Buffer; filename: string }> {
  const membership = await prisma.membership.findFirst({
    where: {
      userId: memberId,
      status: 'accepted',
    },
    include: {
      user: true,
      organization: true,
    },
  }) as any;

  if (!membership) {
    throw new Error('Membership not found');
  }

  if (membership.userId !== currentUserId) {
    throw new Error('Unauthorized');
  }

  const expiryDate = new Date(membership.approvedAt);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const qrPayload = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${memberId}?org=${membership.orgId}`;

  const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

  const cardTemplate = buildMembershipCardTemplate({
    memberName: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
    memberId: membership.userId,
    organizationName: membership.organization.name,
    organizationEmail: membership.organization.email || undefined,
    organizationPhone: membership.organization.phone || undefined,
    role: membership.role,
    status: membership.status,
    accessLevel: 'Standard',
    joinedDate: membership.joinedAt.toISOString().split('T')[0],
    approvedDate: membership.approvedAt.toISOString().split('T')[0],
    expiryDate: expiryDate.toISOString().split('T')[0],
    qrCodeData: qrCodeDataUrl,
  });

  const html = generatePDFCardHtmlString(cardTemplate);
  const buffer = await renderPdfFromHtml(html);

  return {
    buffer,
    filename: `membership-card-${memberId}.pdf`,
  };
}

export async function renderMembershipCardHtml(
  memberId: string,
  currentUserId: string
): Promise<{ html: string; filename: string }> {
  const membership = await prisma.membership.findFirst({
    where: {
      userId: memberId,
      status: 'accepted',
    },
    include: {
      user: true,
      organization: true,
    },
  }) as any;

  if (!membership) {
    throw new Error('Membership not found');
  }

  if (membership.userId !== currentUserId) {
    throw new Error('Unauthorized');
  }

  const expiryDate = new Date(membership.approvedAt);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const qrPayload = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${memberId}?org=${membership.orgId}`;
  const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

  const cardTemplate = buildMembershipCardTemplate({
    memberName: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
    memberId: membership.userId,
    organizationName: membership.organization.name,
    organizationEmail: membership.organization.email || undefined,
    organizationPhone: membership.organization.phone || undefined,
    role: membership.role,
    status: membership.status,
    accessLevel: 'Standard',
    joinedDate: membership.joinedAt.toISOString().split('T')[0],
    approvedDate: membership.approvedAt.toISOString().split('T')[0],
    expiryDate: expiryDate.toISOString().split('T')[0],
    qrCodeData: qrCodeDataUrl,
  });

  return {
    html: generatePDFCardHtmlString(cardTemplate),
    filename: `membership-card-${memberId}.html`,
  };
}

export async function renderMembershipCardUpload(
  memberId: string,
  currentUserId: string,
  format: 'pdf' | 'png' = 'pdf'
): Promise<{ url: string; filename: string; contentType: string }> {
  const { buffer, filename } = await renderMembershipCardPdf(memberId, currentUserId);
  const mimeType = format === 'png' ? 'image/png' : 'application/pdf';
  const destination = `membership-cards/${memberId}-${Date.now()}.${format}`;
  const url = await uploadToStorage(buffer, destination, mimeType);

  return {
    url,
    filename,
    contentType: mimeType,
  };
}

export async function renderBookingGatepassPdf(
  bookingId: string,
  currentUserId: string
): Promise<{ buffer: Buffer; filename: string }> {
  const booking = await prisma.courtBooking.findUnique({
    where: { id: bookingId },
    include: {
      court: {
        include: {
          organization: true,
        },
      },
      member: {
        include: {
          player: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  }) as any;

  if (!booking) {
    throw new Error('Booking not found');
  }

  const playerName = booking.member?.player?.user
    ? `${booking.member.player.user.firstName} ${booking.member.player.user.lastName}`
    : 'Guest Player';

  const isOwnedByMember = booking.member?.player?.user?.id === currentUserId;
  const hasPaymentRecord = await prisma.paymentRecord.findFirst({
    where: {
      userId: currentUserId,
      metadata: {
        contains: bookingId,
      },
    },
  });

  if (!isOwnedByMember && !hasPaymentRecord) {
    throw new Error('Unauthorized');
  }

  const organizationName = booking.court?.organization?.name || 'Tennis Club';
  const courtName = booking.court?.name || 'Court';
  const startDate = booking.startTime ? new Date(booking.startTime) : new Date();
  const endDate = booking.endTime ? new Date(booking.endTime) : undefined;
  const amountPaid = hasPaymentRecord ? Number(hasPaymentRecord.amount).toFixed(2) : '0.00';
  const currency = hasPaymentRecord?.currency?.toUpperCase() || 'USD';

  const validityKey = Buffer.from(`${booking.id}-${booking.courtId}-${new Date().toISOString()}`)
    .toString('base64')
    .substring(0, 16)
    .toUpperCase();

  const qrPayload = JSON.stringify({
    bookingId: booking.id,
    player: playerName,
    court: courtName,
    organization: organizationName,
    startTime: startDate.toISOString(),
    endTime: endDate?.toISOString(),
    status: 'VALID',
    key: validityKey,
  });

  const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

  const template = buildGatepassTemplate({
    playerName,
    courtName,
    organizationName,
    date: formatDate(startDate),
    time: formatTimeRange(startDate, endDate),
    amount: `${currency} ${amountPaid}`,
    validityKey,
    qrCodeData: qrCodeDataUrl,
  });

  const html = generatePDFCardHtmlString(template);
  const buffer = await renderPdfFromHtml(html);

  return {
    buffer,
    filename: `booking-gatepass-${bookingId}.pdf`,
  };
}

export async function renderBookingGatepassHtml(
  bookingId: string,
  currentUserId: string
): Promise<{ html: string; filename: string }> {
  const booking = await prisma.courtBooking.findUnique({
    where: { id: bookingId },
    include: {
      court: {
        include: {
          organization: true,
        },
      },
      member: {
        include: {
          player: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  }) as any;

  if (!booking) {
    throw new Error('Booking not found');
  }

  const playerName = booking.member?.player?.user
    ? `${booking.member.player.user.firstName} ${booking.member.player.user.lastName}`
    : 'Guest Player';

  const isOwnedByMember = booking.member?.player?.user?.id === currentUserId;
  const hasPaymentRecord = await prisma.paymentRecord.findFirst({
    where: {
      userId: currentUserId,
      metadata: {
        contains: bookingId,
      },
    },
  });

  if (!isOwnedByMember && !hasPaymentRecord) {
    throw new Error('Unauthorized');
  }

  const organizationName = booking.court?.organization?.name || 'Tennis Club';
  const courtName = booking.court?.name || 'Court';
  const startDate = booking.startTime ? new Date(booking.startTime) : new Date();
  const endDate = booking.endTime ? new Date(booking.endTime) : undefined;
  const amountPaid = hasPaymentRecord ? Number(hasPaymentRecord.amount).toFixed(2) : '0.00';
  const currency = hasPaymentRecord?.currency?.toUpperCase() || 'USD';

  const validityKey = Buffer.from(`${booking.id}-${booking.courtId}-${new Date().toISOString()}`)
    .toString('base64')
    .substring(0, 16)
    .toUpperCase();

  const qrPayload = JSON.stringify({
    bookingId: booking.id,
    player: playerName,
    court: courtName,
    organization: organizationName,
    startTime: startDate.toISOString(),
    endTime: endDate?.toISOString(),
    status: 'VALID',
    key: validityKey,
  });

  const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

  const template = buildGatepassTemplate({
    playerName,
    courtName,
    organizationName,
    date: formatDate(startDate),
    time: formatTimeRange(startDate, endDate),
    amount: `${currency} ${amountPaid}`,
    validityKey,
    qrCodeData: qrCodeDataUrl,
  });

  return {
    html: generatePDFCardHtmlString(template),
    filename: `booking-gatepass-${bookingId}.html`,
  };
}

export async function renderTournamentEntryTicketPdf(
  tournamentId: string,
  currentUserId: string
): Promise<{ buffer: Buffer; filename: string }> {
  const tournament = await prisma.clubEvent.findUnique({
    where: { id: tournamentId },
    include: {
      organization: true,
    },
  }) as any;

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const member = await prisma.clubMember.findFirst({
    where: { playerId: currentUserId },
    include: { player: true },
  }) as any;

  if (!member) {
    throw new Error('Club membership not found');
  }

  const eventRegistration = await prisma.eventRegistration.findFirst({
    where: {
      eventId: tournamentId,
      memberId: member.id,
    },
    include: {
      member: {
        include: {
          player: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  }) as any;

  if (!eventRegistration) {
    throw new Error('Registration not found');
  }

  const playerName = `${eventRegistration.member?.player?.user?.firstName || 'N/A'} ${eventRegistration.member?.player?.user?.lastName || 'N/A'}`.trim();
  const formattedDate = formatDate(tournament.startDate);
  const validityKey = Buffer.from(`${eventRegistration.id}-${tournament.id}-${new Date().toISOString()}`)
    .toString('base64')
    .substring(0, 16)
    .toUpperCase();

  const qrPayload = JSON.stringify({
    player: playerName,
    event: tournament.name,
    organization: tournament.organization?.name,
    date: formattedDate,
    status: 'VALID',
    validityKey,
    registrationId: eventRegistration.id,
    timestamp: new Date().toISOString(),
  });

  const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

  const template = buildTournamentEntryTemplate({
    playerName,
    eventName: tournament.name,
    organizationName: tournament.organization?.name || 'Tennis Club',
    date: formattedDate,
    validityKey,
    qrCodeData: qrCodeDataUrl,
  });

  const html = generatePDFCardHtmlString(template);
  const buffer = await renderPdfFromHtml(html);

  return {
    buffer,
    filename: `entrance-ticket-${tournamentId}.pdf`,
  };
}

export async function renderTournamentEntryTicketHtml(
  tournamentId: string,
  currentUserId: string
): Promise<{ html: string; filename: string }> {
  const tournament = await prisma.clubEvent.findUnique({
    where: { id: tournamentId },
    include: {
      organization: true,
    },
  }) as any;

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const member = await prisma.clubMember.findFirst({
    where: { playerId: currentUserId },
    include: { player: true },
  }) as any;

  if (!member) {
    throw new Error('Club membership not found');
  }

  const eventRegistration = await prisma.eventRegistration.findFirst({
    where: {
      eventId: tournamentId,
      memberId: member.id,
    },
    include: {
      member: {
        include: {
          player: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  }) as any;

  if (!eventRegistration) {
    throw new Error('Registration not found');
  }

  const playerName = `${eventRegistration.member?.player?.user?.firstName || 'N/A'} ${eventRegistration.member?.player?.user?.lastName || 'N/A'}`.trim();
  const formattedDate = formatDate(tournament.startDate);
  const validityKey = Buffer.from(`${eventRegistration.id}-${tournament.id}-${new Date().toISOString()}`)
    .toString('base64')
    .substring(0, 16)
    .toUpperCase();

  const qrPayload = JSON.stringify({
    player: playerName,
    event: tournament.name,
    organization: tournament.organization?.name,
    date: formattedDate,
    status: 'VALID',
    validityKey,
    registrationId: eventRegistration.id,
    timestamp: new Date().toISOString(),
  });

  const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

  const template = buildTournamentEntryTemplate({
    playerName,
    eventName: tournament.name,
    organizationName: tournament.organization?.name || 'Tennis Club',
    date: formattedDate,
    validityKey,
    qrCodeData: qrCodeDataUrl,
  });

  return {
    html: generatePDFCardHtmlString(template),
    filename: `entrance-ticket-${tournamentId}.html`,
  };
}
