export interface PDFCardField {
  label: string;
  value: string;
}

export interface PDFCardTemplateData {
  title: string;
  subtitle: string;
  fields: PDFCardField[];
  footerNote: string;
  badgeText: string;
  badgeColor?: string;
  qrCodeData?: string;
  footerSubtext?: string;
}

export interface MembershipCardTemplateInput {
  memberName: string;
  memberId: string;
  organizationName: string;
  organizationEmail?: string;
  organizationPhone?: string;
  role: string;
  status: string;
  accessLevel: string;
  joinedDate: string;
  approvedDate: string;
  expiryDate: string;
  qrCodeData?: string;
}

export type MembershipCardData = MembershipCardTemplateInput;

export interface GatepassTemplateInput {
  playerName: string;
  courtName: string;
  organizationName: string;
  date: string;
  time: string;
  amount: string;
  validityKey: string;
  qrCodeData?: string;
}

export interface TournamentEntryTemplateInput {
  playerName: string;
  eventName: string;
  organizationName: string;
  date: string;
  validityKey: string;
  qrCodeData?: string;
}

export interface QRCodeGeneratorOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface BrandingTokens {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  badgeText: string;
}
