import { authenticatedFetch } from '@/lib/authenticatedFetch';

export type PdfDownloadKind = 'membershipCard' | 'bookingGatepass' | 'tournamentEntryTicket';

export interface BasePdfDownloadOptions {
  filename?: string;
}

export interface BookingGatepassDownloadOptions extends BasePdfDownloadOptions {
  kind: 'bookingGatepass';
  bookingId: string;
  url?: string;
}

export interface TournamentEntryDownloadOptions extends BasePdfDownloadOptions {
  kind: 'tournamentEntryTicket';
  tournamentId: string;
  url?: string;
}

export interface MembershipCardDownloadOptions extends BasePdfDownloadOptions {
  kind: 'membershipCard';
  memberId: string;
  url?: string;
}

export type DownloadUnifiedPDFOptions =
  | BookingGatepassDownloadOptions
  | TournamentEntryDownloadOptions
  | MembershipCardDownloadOptions;

const fallbackFilename = (kind: PdfDownloadKind, id?: string) => {
  switch (kind) {
    case 'bookingGatepass':
      return `VicoTennis_Gatepass_${id || 'booking'}.pdf`;
    case 'tournamentEntryTicket':
      return `entrance-ticket-${id || 'tournament'}.pdf`;
    case 'membershipCard':
      return `VicoTennis_Membership_Card_${id || 'member'}.pdf`;
    default:
      return 'document.pdf';
  }
};

const downloadBlobAsFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

const fetchPdfBlob = async (url: string): Promise<Blob> => {
  const response = await authenticatedFetch(url, { method: 'GET', requireAuth: true });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to download PDF from ${url}: ${response.status} ${errorText}`);
  }

  return await response.blob();
};

export async function downloadUnifiedPDF(options: DownloadUnifiedPDFOptions): Promise<void> {
  const filename = options.filename
    ?? fallbackFilename(
      options.kind,
      options.kind === 'membershipCard'
        ? (options as MembershipCardDownloadOptions).memberId
        : options.kind === 'bookingGatepass'
        ? (options as BookingGatepassDownloadOptions).bookingId
        : (options as TournamentEntryDownloadOptions).tournamentId
    );

  // All PDF types now use server-side rendering via REST endpoints
  const url =
    options.url
      ? options.url
      : options.kind === 'membershipCard'
      ? `/api/members/${(options as MembershipCardDownloadOptions).memberId}/card`
      : options.kind === 'bookingGatepass'
      ? `/api/bookings/${(options as BookingGatepassDownloadOptions).bookingId}/gatepass`
      : `/api/tournaments/${(options as TournamentEntryDownloadOptions).tournamentId}/entrance-ticket`;

  const blob = await fetchPdfBlob(url);
  downloadBlobAsFile(blob, filename);
}
