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

  // Generate QR code data URL (large, highly scannable)
  const qrCodeDataUrl = data.qrCodeData
    ? await QRCode.toDataURL(data.qrCodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
    : '';

  // ━━━ ROOT CONTAINER — Credit Card dimensions ━━━
  const container = document.createElement('div');
  container.style.cssText = `
    background: #f8fafc;
    width: 85.6mm;
    height: 54mm;
    max-width: 85.6mm;
    max-height: 54mm;
    position: relative;
    overflow: hidden;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #0f172a;
    box-sizing: border-box;
    margin: 0;
    border-radius: 10px;
    background-image:
      linear-gradient(135deg, rgba(15,23,42,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15,23,42,0.03) 0.5px, transparent 0.5px);
    background-size: 10mm 10mm, 100% 8mm;
  `;

  // ━━━ CONTENT CARD — paper-like panel ━━━
  const card = document.createElement('div');
  card.style.cssText = `
    position: relative;
    z-index: 1;
    width: calc(100% - 10px);
    height: calc(100% - 10px);
    margin: 5px;
    padding: 12px 14px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: rgba(255,255,255,0.96);
    border: 1px solid rgba(15,23,42,0.08);
    box-shadow: 0 15px 35px rgba(15,23,42,0.08);
    overflow: hidden;
  `;
  card.setAttribute('data-pdf-content', 'true');

  // ━━━ HEADER SECTION — Formal branding ━━━
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
    gap: 8px;
    margin-bottom: 10px;
  `;

  const headerLeft = document.createElement('div');
  headerLeft.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 2px;
  `;

  const headerTop = document.createElement('div');
  headerTop.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const headerLogo = document.createElement('img');
  headerLogo.src = logoUrl;
  headerLogo.alt = 'Vico Tennis';
  headerLogo.crossOrigin = 'anonymous';
  headerLogo.style.cssText = `
    width: 32px;
    height: auto;
    border-radius: 6px;
    background: white;
    padding: 4px;
    flex-shrink: 0;
  `;
  headerTop.appendChild(headerLogo);

  const orgName = document.createElement('div');
  orgName.style.cssText = `
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #0f172a;
  `;
  orgName.textContent = data.organizationName;
  headerTop.appendChild(orgName);

  headerLeft.appendChild(headerTop);

  const titleText = document.createElement('div');
  titleText.style.cssText = `
    font-size: 0.55rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    color: #475569;
  `;
  titleText.textContent = 'Membership Card';
  headerLeft.appendChild(titleText);

  const statusBadge = document.createElement('div');
  statusBadge.style.cssText = `
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 0.55rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    align-self: flex-start;
    background: ${data.status === 'active' ? '#dcfce7' : '#fef3c7'};
    color: ${data.status === 'active' ? '#166534' : '#92400e'};
  `;
  statusBadge.textContent = data.status;

  header.appendChild(headerLeft);
  header.appendChild(statusBadge);
  card.appendChild(header);

  // ━━━ DETAILS GRID — formal info layout ━━━
  const detailsGrid = document.createElement('div');
  detailsGrid.style.cssText = `
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 10px;
    width: 100%;
    align-items: stretch;
    margin-bottom: 10px;
  `;

  const detailList = document.createElement('div');
  detailList.style.cssText = `
    display: grid;
    gap: 8px;
  `;

  const addDetail = (label: string, value: string) => {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: baseline;
    `;

    const labelEl = document.createElement('div');
    labelEl.style.cssText = `
      font-size: 0.48rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    `;
    labelEl.textContent = label;

    const valueEl = document.createElement('div');
    valueEl.style.cssText = `
      font-size: 0.75rem;
      color: #0f172a;
      font-weight: 700;
      text-align: right;
      min-width: 54px;
    `;
    valueEl.textContent = value;

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    detailList.appendChild(row);
  };

  addDetail('Member', data.memberName);
  addDetail('Role', data.role);
  addDetail('Access', data.accessLevel);
  addDetail('Joined', data.joinedDate);
  addDetail('Approved', data.approvedDate);
  addDetail('Expiry', data.expiryDate);
  if (data.organizationEmail) addDetail('Email', data.organizationEmail);
  if (data.organizationPhone) addDetail('Phone', data.organizationPhone);

  const qrSection = document.createElement('div');
  qrSection.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid rgba(15,23,42,0.08);
    width: 100%;
    min-height: 100%;
  `;

  const qrCodeWrapper = document.createElement('div');
  qrCodeWrapper.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 8px;
    background: white;
    border-radius: 12px;
    box-shadow: inset 0 0 0 1px rgba(15,23,42,0.03);
  `;

  const qrCode = document.createElement('img');
  qrCode.src = qrCodeDataUrl;
  qrCode.alt = 'Verification QR Code';
  qrCode.style.cssText = `
    width: 90px;
    height: 90px;
    border-radius: 8px;
    image-rendering: pixelated;
  `;
  qrCodeWrapper.appendChild(qrCode);

  const qrLabel = document.createElement('div');
  qrLabel.style.cssText = `
    font-size: 0.55rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 8px;
    text-align: center;
  `;
  qrLabel.textContent = 'Scan to Verify';

  const qrCaption = document.createElement('div');
  qrCaption.style.cssText = `
    font-size: 0.5rem;
    color: #94a3b8;
    text-align: center;
    line-height: 1.3;
    margin-top: 2px;
  `;
  qrCaption.textContent = 'Secure digital access';

  qrSection.appendChild(qrCodeWrapper);
  qrSection.appendChild(qrLabel);
  qrSection.appendChild(qrCaption);

  detailsGrid.appendChild(detailList);
  detailsGrid.appendChild(qrSection);
  card.appendChild(detailsGrid);

  const footer = document.createElement('div');
  footer.style.cssText = `
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 0.5rem;
    color: #64748b;
    letter-spacing: 0.04em;
  `;

  const footerLeft = document.createElement('div');
  footerLeft.textContent = 'Issued by Vico Tennis';

  const footerRight = document.createElement('div');
  footerRight.textContent = `Valid through ${data.expiryDate}`;

  footer.appendChild(footerLeft);
  footer.appendChild(footerRight);
  card.appendChild(footer);

  container.appendChild(card);
  return container;
}
