import type {
  PDFCardTemplateData,
  MembershipCardTemplateInput,
  GatepassTemplateInput,
  TournamentEntryTemplateInput,
  BrandingTokens,
} from '../types';
import { DEFAULT_BRANDING } from '../branding';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const compiledTailwind = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'tailwind-compiled.css'),
  'utf8'
);

const buildCardMarkup = (data: PDFCardTemplateData): string => {
  const fieldsHtml = data.fields
    .map(
      (field) => `
        <div class="pdf-card-row">
          <div class="pdf-card-label">${field.label}</div>
          <div class="pdf-card-value">${field.value}</div>
        </div>
      `
    )
    .join('');

  const qrHtml = data.qrCodeData
    ? `
      <div class="pdf-card-qr-section">
        <div class="pdf-card-qr-wrapper">
          <img src="${data.qrCodeData}" alt="QR Code" />
        </div>
      </div>
    `
    : '';

  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 to-emerald-800 p-8">
      <div class="w-full max-w-md bg-[rgba(15,39,16,0.95)] border-2 rounded-2xl p-8 shadow-2xl" style="border-color: ${DEFAULT_BRANDING.primary};">
        <div class="text-center mb-6 pb-4 border-b border-emerald-600">
          <div class="text-2xl font-extrabold text-emerald-400">${data.title}</div>
          <div class="text-xs text-emerald-300 font-medium uppercase tracking-wider">${data.subtitle}</div>
        </div>

        <div class="flex gap-6 items-start mb-6">
          <div class="flex-1">
            ${fieldsHtml}
          </div>
          ${qrHtml}
        </div>

        <div class="text-center pt-4 border-t border-emerald-600">
          <div class="text-sm text-emerald-300 mb-2">${data.footerNote}</div>
          <div class="inline-block text-black px-3 py-2 rounded font-semibold text-sm" style="background:${data.badgeColor ?? DEFAULT_BRANDING.primary};">
            ${data.badgeText}
          </div>
          ${data.footerSubtext ? `<div class="text-xs text-emerald-300 mt-2">${data.footerSubtext}</div>` : ''}
        </div>
      </div>
    </div>
  `;
};

export const generatePDFCardHtmlString = (
  data: PDFCardTemplateData,
  branding: BrandingTokens = DEFAULT_BRANDING
): string => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        ${compiledTailwind}
        img { image-rendering: pixelated; }
      </style>
    </head>
    <body>
      ${buildCardMarkup(data)}
    </body>
  </html>
`;

export function buildMembershipCardTemplate(data: MembershipCardTemplateInput): PDFCardTemplateData {
  const isActive = data.status.toLowerCase() === 'accepted' || data.status.toLowerCase() === 'active';

  return {
    title: '🎾 Vico Tennis',
    subtitle: 'Member Access Card',
    fields: [
      { label: 'Member', value: data.memberName },
      { label: 'Organization', value: data.organizationName },
      { label: 'Role', value: data.role },
      { label: 'Access Level', value: data.accessLevel },
      { label: 'Joined', value: data.joinedDate },
      { label: 'Approved', value: data.approvedDate },
      { label: 'Expires', value: data.expiryDate },
    ],
    footerNote: 'Present this card for member access and benefits.',
    badgeText: isActive ? '✅ VALID ACCESS' : '⏳ PENDING',
    badgeColor: isActive ? DEFAULT_BRANDING.primary : '#f0c040',
    qrCodeData: data.qrCodeData,
  };
}

export function buildGatepassTemplate(data: GatepassTemplateInput): PDFCardTemplateData {
  return {
    title: '🎾 Vico Tennis',
    subtitle: 'Court Booking Gatepass',
    fields: [
      { label: 'Player', value: data.playerName },
      { label: 'Court', value: data.courtName },
      { label: 'Organization', value: data.organizationName },
      { label: 'Date', value: data.date },
      { label: 'Time', value: data.time },
      { label: 'Amount', value: data.amount },
    ],
    footerNote: 'Present this gatepass at court entrance.',
    badgeText: '✅ VALID ACCESS',
    badgeColor: DEFAULT_BRANDING.primary,
    qrCodeData: data.qrCodeData,
    footerSubtext: `Key: ${data.validityKey}`,
  };
}

export function buildTournamentEntryTemplate(data: TournamentEntryTemplateInput): PDFCardTemplateData {
  return {
    title: '🎾 Vico Tennis',
    subtitle: 'Tournament Access',
    fields: [
      { label: 'Player', value: data.playerName },
      { label: 'Event', value: data.eventName },
      { label: 'Organization', value: data.organizationName },
      { label: 'Date', value: data.date },
    ],
    footerNote: 'Present this ticket at tournament entrance.',
    badgeText: '✅ VALID ACCESS',
    badgeColor: DEFAULT_BRANDING.primary,
    qrCodeData: data.qrCodeData,
    footerSubtext: `Key: ${data.validityKey}`,
  };
}
