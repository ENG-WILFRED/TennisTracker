import type { BrandingTokens } from './types';

export const DEFAULT_BRANDING: BrandingTokens = {
  primary: '#0e7490',
  secondary: '#0aa0b0',
  accent: '#7c3aed',
  background: '#0f1720',
  surface: 'rgba(11, 18, 32, 0.95)',
  border: '#123a43',
  text: '#e6f6f8',
  muted: '#a8c7cb',
  badgeText: '#0f1720',
};

export const getSharedCardStyles = (branding: BrandingTokens = DEFAULT_BRANDING): string => `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    min-height: 100%;
  }

  body {
    font-family: 'Epilogue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: linear-gradient(135deg, ${branding.background} 0%, #122733 100%);
    color: ${branding.text};
  }

  .pdf-card-root {
    width: 100%;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    box-sizing: border-box;
    background: linear-gradient(135deg, ${branding.background} 0%, #122733 100%);
  }

  .pdf-card-frame {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 540px;
    background: ${branding.surface};
    border: 2px solid ${branding.border};
    border-radius: 16px;
    padding: 48px 56px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(10, 160, 176, 0.08);
    box-sizing: border-box;
  }

  .pdf-card-header {
    text-align: center;
    margin-bottom: 32px;
    border-bottom: 1px solid rgba(10, 160, 176, 0.12);
    padding-bottom: 20px;
  }

  .pdf-card-title {
    font-size: 28px;
    font-weight: 700;
    color: ${branding.primary};
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }

  .pdf-card-subtitle {
    font-size: 13px;
    color: ${branding.secondary};
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .pdf-card-body {
    display: flex;
    gap: 32px;
    align-items: flex-start;
    margin-bottom: 28px;
  }

  .pdf-card-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pdf-card-row {
    margin-bottom: 12px;
  }

  .pdf-card-label {
    font-size: 11px;
    color: ${branding.secondary};
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }

  .pdf-card-value {
    font-size: 18px;
    color: ${branding.text};
    font-weight: 600;
    line-height: 1.3;
  }

  .pdf-card-qr-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 160px;
  }

  .pdf-card-qr-wrapper {
    background: #ffffff;
    border: 1px solid rgba(125, 193, 66, 0.4);
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .pdf-card-qr-wrapper img {
    width: 140px;
    height: 140px;
    display: block;
    image-rendering: pixelated;
  }

  .pdf-card-footer {
    text-align: center;
    border-top: 1px solid rgba(10, 160, 176, 0.12);
    padding-top: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .pdf-card-footer-note {
    font-size: 12px;
    color: ${branding.muted};
    line-height: 1.6;
  }

  .pdf-card-status-badge {
    display: inline-block;
    color: ${branding.badgeText};
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .pdf-card-footer-subtext {
    font-size: 10px;
    color: ${branding.muted};
    letter-spacing: 0.6px;
  }
`;
