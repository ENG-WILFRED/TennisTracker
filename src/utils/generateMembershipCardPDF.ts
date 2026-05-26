/**
 * Shared PDF Card Generator
 * Renders a consistent card layout across membership cards, booking gatepasses, and tournament tickets.
 */

import type { MembershipCardData } from '@document-kit';
import { buildMembershipCardTemplate, generatePDFCardHtmlString, generateQRCodeDataUrl } from '@document-kit';

export { MembershipCardData };

export const generateMembershipCardHtmlString = async (data: MembershipCardData): Promise<string> => {
  const qr = data.qrCodeData ?? `${process.env.NEXT_PUBLIC_APP_URL}/verify/${data.memberId}`;
  const qrDataUrl = await generateQRCodeDataUrl(qr);
  const template = buildMembershipCardTemplate({ ...data, qrCodeData: qrDataUrl });
  return generatePDFCardHtmlString(template);
};

export const generateMembershipCardHTMLElement = async (data: MembershipCardData): Promise<HTMLElement> => {
  const html = await generateMembershipCardHtmlString(data);
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  return wrapper;
};
