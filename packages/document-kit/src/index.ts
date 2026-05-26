import QRCode from 'qrcode';

let sharedBrowser: any = null;

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
  const qrDataUrl = fields['QR Data'] || '';
  const validityKey = fields['Valid Key'] || fields['Ticket ID'] || '';

  const fieldEntries = Object.entries(fields).filter(
    ([key]) => key !== 'QR Data' && key !== 'Valid Key'
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      @page { margin: 0; size: A4; }

      body {
        min-height: 100vh;
        background: #0c1f09;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        padding: 40px 20px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background-image:
          radial-gradient(ellipse 70% 45% at 50% 0%, rgba(80,160,50,0.13) 0%, transparent 70%);
      }

      .card {
        position: relative;
        width: min(460px, 100%);
        border-radius: 22px;
        border: 1.5px solid rgba(120,200,80,0.38);
        background: rgba(10, 30, 10, 0.98);
        box-shadow:
          0 0 0 1px rgba(100,180,60,0.06) inset,
          0 32px 80px rgba(0,0,0,0.55);
        overflow: hidden;
      }

      .card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 90px;
        background: radial-gradient(ellipse 80% 100% at 50% 0%, rgba(110,200,60,0.10) 0%, transparent 100%);
        pointer-events: none;
      }

      .header {
        padding: 28px 32px 16px;
        text-align: center;
        position: relative;
      }

      .brand {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .brand-icon { font-size: 22px; line-height: 1; }

      .brand-text {
        font-weight: 700;
        font-size: 26px;
        color: #b8f07a;
        letter-spacing: 0.04em;
      }

      .subtitle {
        font-size: 9.5px;
        font-weight: 800;
        letter-spacing: 0.34em;
        color: #7ec85a;
        text-transform: uppercase;
        margin-top: 2px;
      }

      .header-divider {
        width: 100px;
        height: 1px;
        background: rgba(140,210,80,0.20);
        margin: 14px auto 0;
      }

      .body {
        display: flex;
        gap: 20px;
        padding: 20px 32px 22px;
        align-items: flex-start;
      }

      .details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .field { display: flex; flex-direction: column; gap: 3px; }

      .field-label {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: #6aad4a;
      }

      .field-value {
        font-size: 15px;
        font-weight: 700;
        color: #d8f5b8;
        line-height: 1.3;
      }

      .qr-panel {
        flex-shrink: 0;
        width: 180px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(18,45,14,0.90);
        border: 1px solid rgba(120,200,70,0.22);
        border-radius: 18px;
      }

      .qr-img-wrap {
        width: 168px;
        height: 168px;
        background: #fff;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .qr-img-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .divider {
        height: 1px;
        background: rgba(140,210,80,0.13);
        margin: 0 32px;
      }

      .footer {
        padding: 16px 32px 18px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .footer-note {
        font-size: 10px;
        color: #557a42;
        letter-spacing: 0.05em;
      }

      .valid-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 22px;
        border-radius: 999px;
        background: linear-gradient(135deg, #5dc43a 0%, #2d7a1a 60%, #1a5210 100%);
        color: #e8fbd2;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .valid-pill::before {
        content: '✓';
        font-size: 12px;
        font-weight: 900;
      }

      @media (max-width: 500px) {
        .body { flex-direction: column; align-items: stretch; }
        .qr-panel { width: 100%; }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <div class="brand">
          <span class="brand-icon">🎾</span>
          <span class="brand-text">Vico Tennis</span>
        </div>
        <div class="subtitle">Tournament Access</div>
        <div class="header-divider"></div>
      </div>

      <div class="body">
        <div class="details">
          ${fieldEntries
            .map(
              ([key, value]) => `
          <div class="field">
            <div class="field-label">${escapeHtml(key)}</div>
            <div class="field-value">${escapeHtml(value)}</div>
          </div>`
            )
            .join('')}
        </div>

        <div class="qr-panel">
          <div class="qr-img-wrap">
            <img src="${escapeHtml(qrDataUrl)}" alt="QR code" />
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="footer">
        <span class="footer-note">Present this ticket at tournament entrance</span>
        <div class="valid-pill">Valid Access</div>
      </div>
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
    'QR Data': data.qrCodeData || '',
  });
}

export function buildGatepassTemplate(data: GatepassTemplateInput): string {
  return createSimpleHtml('Gatepass', {
    Player: data.playerName,
    Court: data.courtName,
    Organization: data.organizationName,
    Date: data.date,
    Time: data.time,
    Amount: data.amount,
    'Valid Key': data.validityKey,
    'QR Data': data.qrCodeData,
  });
}

export function buildTournamentEntryTemplate(data: TournamentEntryTemplateInput): string {
  return createSimpleHtml('Tournament Entry Ticket', {
    Player: data.playerName,
    Event: data.eventName,
    Organization: data.organizationName,
    Date: data.date,
    'Ticket ID': data.validityKey,
    'QR Data': data.qrCodeData,
  });
}

export function generatePDFCardHtmlString(template: string): string {
  return template;
}

export async function generateQRCodeDataUrl(payload: string): Promise<string> {
  if (!payload) {
    throw new Error('QR code payload is required');
  }
  return await QRCode.toDataURL(payload, {
    margin: 2,
    width: 340,
    errorCorrectionLevel: 'H',
    type: 'image/png',
  });
}

async function getSharedBrowser(): Promise<any> {
  if (sharedBrowser?.isConnected?.()) {
    return sharedBrowser;
  }

  const puppeteer = require('puppeteer');
  const launchOptions: any = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  sharedBrowser = await puppeteer.launch(launchOptions);
  return sharedBrowser;
}

export async function renderPdfFromHtml(html: string): Promise<Buffer> {
  let page: any;
  try {
    const browser = await getSharedBrowser();
    page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      timeout: 30000,
    });
    return Buffer.from(pdfBuffer);
  } catch (err) {
    try { console.warn('renderPdfFromHtml: puppeteer PDF render failed.', err); } catch (_) {}
    throw new Error('PDF_RENDER_FAILED');
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (_) {}
    }
  }
}