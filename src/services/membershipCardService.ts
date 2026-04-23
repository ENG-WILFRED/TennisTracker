import * as puppeteer from 'puppeteer';
import { MembershipCardData, generateMembershipCardHTML } from '@/utils/generateMembershipCardPDF';
import { uploadToStorage } from '@/lib/storage';

export interface CardGenerationOptions {
  format?: 'pdf' | 'png';
  quality?: number;
  organizationId?: string;
}

export interface CardGenerationResult {
  url: string;
  qrPayload: string;
  issuedAt: string;
  expiresAt: string;
}

export class MembershipCardService {
  private browser: puppeteer.Browser | null = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async generateCard(
    data: MembershipCardData,
    options: CardGenerationOptions = {}
  ): Promise<CardGenerationResult> {
    await this.initialize();

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    try {
      // Generate HTML content
      const htmlElement = await generateMembershipCardHTML(data);
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Membership Card</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
          </style>
        </head>
        <body>
          ${htmlElement.outerHTML}
        </body>
        </html>
      `;

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Set viewport to card dimensions
      await page.setViewport({
        width: 322, // 85.6mm at 96 DPI
        height: 204, // 54mm at 96 DPI
        deviceScaleFactor: 2
      });

      // Generate PDF or PNG
      let buffer: Buffer;
      const { format = 'pdf' } = options;

      if (format === 'png') {
        const screenshot = await page.screenshot({
          type: 'png',
          fullPage: true,
          quality: options.quality || 90
        });
        buffer = screenshot as Buffer;
      } else {
        buffer = (await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          },
          width: '85.6mm',
          height: '54mm'
        })) as Buffer;
      }

      // Upload to storage
      const fileName = `membership-cards/${data.memberId}-${Date.now()}.${format}`;
      const url = await uploadToStorage(buffer, fileName, `image/${format}`);

      return {
        url,
        qrPayload: data.qrCodeData || '',
        issuedAt: new Date().toISOString(),
        expiresAt: data.expiryDate
      };

    } finally {
      await page.close();
    }
  }

  async generateBatchCards(
    cardRequests: Array<{ data: MembershipCardData; options?: CardGenerationOptions }>,
    organizationId?: string
  ): Promise<CardGenerationResult[]> {
    const results: CardGenerationResult[] = [];

    for (const request of cardRequests) {
      try {
        const result = await this.generateCard(request.data, {
          ...request.options,
          organizationId
        });
        results.push(result);
      } catch (error) {
        console.error('Failed to generate card for member:', request.data.memberId, error);
        // Continue with other cards
      }
    }

    return results;
  }
}

// Singleton instance
export const membershipCardService = new MembershipCardService();