import puppeteer from 'puppeteer';

export interface RenderPdfOptions {
  format?: string;
  width?: number;
  height?: number;
}

export async function renderPdfFromHtml(
  html: string | { outerHTML?: string; toString?: () => string },
  options: RenderPdfOptions = {}
): Promise<Buffer> {
  const pdfFormat = (options.format ?? 'A4') as any;
  const htmlString =
    typeof html === 'string'
      ? html
      : html && typeof html.outerHTML === 'string'
      ? html.outerHTML
      : html && typeof html.toString === 'function'
      ? html.toString()
      : '';
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: options.width ?? 1024,
    height: options.height ?? 1440,
  });

  await page.setContent(htmlString, {
    waitUntil: ['domcontentloaded'],
    timeout: 30000,
  });

  const buffer = await page.pdf({
    format: pdfFormat,
    printBackground: true,
    margin: {
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    },
  });

  await page.close();
  await browser.close();

  return buffer as Buffer;
}
