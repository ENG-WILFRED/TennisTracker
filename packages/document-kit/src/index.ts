export interface MembershipCardData {
  memberId: string;
  memberName: string;
  organizationName: string;
  organizationEmail?: string;
  organizationPhone?: string;
  role?: string;
  status?: string;
  accessLevel?: string;
  joinedDate?: string;
  approvedDate?: string;
  expiryDate?: string;
  qrCodeData?: string;
  [key: string]: any;
}

export interface MembershipCardTemplateInput extends MembershipCardData {}

export interface GatepassTemplateInput {
  playerName: string;
  courtName: string;
  organizationName: string;
  date: string;
  time: string;
  amount: string;
  validityKey: string;
  qrCodeData: string;
}

export interface TournamentEntryTemplateInput {
  playerName: string;
  eventName: string;
  organizationName: string;
  date: string;
  validityKey: string;
  qrCodeData: string;
}

function createSimpleHtml(title: string, fields: Record<string, string>): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #111827; color: #e2e8f0; }
      .card { border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 24px; background: #0f172a; }
      .title { font-size: 22px; font-weight: 800; margin-bottom: 16px; }
      .row { margin-bottom: 10px; }
      .label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
      .value { margin-top: 4px; font-size: 16px; font-weight: 700; }
      .qr { margin-top: 20px; word-break: break-all; font-size: 11px; color: #cbd5e1; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="title">${title}</div>
      ${Object.entries(fields)
        .map(
          ([key, value]) =>
            `<div class="row"><div class="label">${key}</div><div class="value">${value}</div></div>`
        )
        .join('')}
    </div>
  </body>
</html>`;
}

export function buildMembershipCardTemplate(data: MembershipCardData): string {
  return createSimpleHtml('Membership Card', {
    'Member': data.memberName,
    'Member ID': data.memberId,
    'Organization': data.organizationName,
    'Role': data.role || 'Member',
    'Status': data.status || 'Active',
    'Access Level': data.accessLevel || 'Standard',
    'Joined': data.joinedDate || '-',
    'Approved': data.approvedDate || '-',
    'Expires': data.expiryDate || '-',
    'QR Data': data.qrCodeData || 'N/A',
  });
}

export function buildGatepassTemplate(data: GatepassTemplateInput): string {
  return createSimpleHtml('Booking Gatepass', {
    'Player': data.playerName,
    'Court': data.courtName,
    'Organization': data.organizationName,
    'Date': data.date,
    'Time': data.time,
    'Amount': data.amount,
    'Valid Key': data.validityKey,
    'QR Data': data.qrCodeData,
  });
}

export function buildTournamentEntryTemplate(data: TournamentEntryTemplateInput): string {
  return createSimpleHtml('Tournament Entry Ticket', {
    'Player': data.playerName,
    'Event': data.eventName,
    'Organization': data.organizationName,
    'Date': data.date,
    'Ticket ID': data.validityKey,
    'QR Data': data.qrCodeData,
  });
}

export function generatePDFCardHtmlString(template: string): string {
  return template;
}

export async function generateQRCodeDataUrl(payload: string): Promise<string> {
  const safe = encodeURIComponent(payload);
  return `data:image/svg+xml,${safe}`;
}

export async function renderPdfFromHtml(html: string): Promise<Buffer> {
  return Buffer.from(html, 'utf-8');
}
