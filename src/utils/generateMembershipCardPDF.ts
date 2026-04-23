/**
 * Membership Card PDF Generator
 * Creates a credit card-sized, verifiable membership card for Vico Tennis members
 */

import QRCode from 'qrcode';

export interface MembershipCardData {
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

export async function generateMembershipCardHTML(data: MembershipCardData): Promise<HTMLElement> {
  const logoUrl = '/vico_logo.png';

  // Generate QR code data URL
  const qrCodeDataUrl = data.qrCodeData
    ? await QRCode.toDataURL(data.qrCodeData, {
        width: 64,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
    : '';

  // ━━━ ROOT CONTAINER — Credit Card dimensions ━━━
  const container = document.createElement('div');
  container.style.cssText = `
    background: #ffffff;
    width: 85.6mm;
    height: 54mm;
    max-width: 85.6mm;
    max-height: 54mm;
    position: relative;
    overflow: hidden;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #0f172a;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  `;

  // ━━━ CONTENT CARD — fits within card margins ━━━
  const card = document.createElement('div');
  card.style.cssText = `
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    padding: 8px 12px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  `;
  card.setAttribute('data-pdf-content', 'true');

  // ━━━ HEADER SECTION — Compact for card ━━━
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    width: 100%;
    box-sizing: border-box;
  `;

  const headerLeft = document.createElement('div');
  headerLeft.style.cssText = `
    display: flex;
    align-items: center;
    gap: 6px;
  `;

  const headerLogo = document.createElement('img');
  headerLogo.src = logoUrl;
  headerLogo.alt = 'Vico Tennis';
  headerLogo.crossOrigin = 'anonymous';
  headerLogo.style.cssText = `
    width: 24px;
    height: auto;
    border-radius: 4px;
    background: white;
    padding: 2px;
    flex-shrink: 0;
  `;
  headerLeft.appendChild(headerLogo);

  const orgName = document.createElement('div');
  orgName.style.cssText = `
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #0e7490;
  `;
  orgName.textContent = data.organizationName;
  headerLeft.appendChild(orgName);

  const statusBadge = document.createElement('div');
  statusBadge.style.cssText = `
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 0.5rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: ${data.status === 'active' ? '#dcfce7' : '#fef3c7'};
    color: ${data.status === 'active' ? '#166534' : '#92400e'};
  `;
  statusBadge.textContent = data.status;
  header.appendChild(headerLeft);
  header.appendChild(statusBadge);
  card.appendChild(header);

  // ━━━ MAIN CONTENT — Member info ━━━
  const mainContent = document.createElement('div');
  mainContent.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    text-align: center;
    margin-bottom: 8px;
  `;

  const memberName = document.createElement('div');
  memberName.style.cssText = `
    font-size: 1.1rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 4px;
    line-height: 1.2;
  `;
  memberName.textContent = data.memberName;
  mainContent.appendChild(memberName);

  const memberRole = document.createElement('div');
  memberRole.style.cssText = `
    font-size: 0.7rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `;
  memberRole.textContent = data.role;
  mainContent.appendChild(memberRole);

  card.appendChild(mainContent);

  // ━━━ BOTTOM SECTION — QR Code, ID, Expiry ━━━
  const bottomSection = document.createElement('div');
  bottomSection.style.cssText = `
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    width: 100%;
    box-sizing: border-box;
    margin-top: auto;
  `;

  const leftSection = document.createElement('div');
  leftSection.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 2px;
  `;

  const memberId = document.createElement('div');
  memberId.style.cssText = `
    font-size: 0.55rem;
    font-weight: 700;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `;
  memberId.textContent = `ID: ${data.memberId}`;
  leftSection.appendChild(memberId);

  const expiryDate = document.createElement('div');
  expiryDate.style.cssText = `
    font-size: 0.5rem;
    color: #6b7280;
    font-weight: 600;
  `;
  expiryDate.textContent = `Expires: ${data.expiryDate}`;
  leftSection.appendChild(expiryDate);

  const qrSection = document.createElement('div');
  qrSection.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  `;

  // QR Code
  const qrCode = document.createElement('img');
  qrCode.src = qrCodeDataUrl;
  qrCode.alt = 'Verification QR Code';
  qrCode.style.cssText = `
    width: 28px;
    height: 28px;
    border-radius: 4px;
    background: white;
    border: 1px solid #e5e7eb;
  `;
  qrSection.appendChild(qrCode);

  const qrLabel = document.createElement('div');
  qrLabel.style.cssText = `
    font-size: 0.45rem;
    color: #9ca3af;
    text-align: center;
    font-weight: 500;
  `;
  qrLabel.textContent = 'Verify';
  qrSection.appendChild(qrLabel);

  bottomSection.appendChild(leftSection);
  bottomSection.appendChild(qrSection);
  card.appendChild(bottomSection);

  container.appendChild(card);
  return container;
}
