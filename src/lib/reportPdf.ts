interface ReportPdfOptions {
  filename: string;
  reportTitle: string;
  reportDescription?: string;
  reportDate?: string;
  margin?: number;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
}

const createHeaderElement = (options: ReportPdfOptions): HTMLElement => {
  const header = document.createElement('div');
  header.style.cssText = [
    'background-color:#f0f9ff',
    'border:1px solid #93c5fd',
    'border-left:6px solid #0ea5e9',
    'padding:24px',
    'border-radius:12px',
    'margin-bottom:20px',
    'font-family:Inter,ui-sans-serif,sans-serif',
  ].join(';');

  const title = document.createElement('h1');
  title.textContent = options.reportTitle;
  title.style.cssText = 'margin:0 0 8px 0;font-size:28px;font-weight:800;color:#0f172a';
  header.appendChild(title);

  if (options.reportDescription) {
    const description = document.createElement('p');
    description.textContent = options.reportDescription;
    description.style.cssText = 'margin:0 0 8px 0;font-size:14px;color:#475569;line-height:1.6';
    header.appendChild(description);
  }

  const date = document.createElement('p');
  date.textContent = `Report date: ${options.reportDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  date.style.cssText = 'margin:0;font-size:12px;color:#64748b;';
  header.appendChild(date);

  return header;
};

const removeIgnoredElements = (element: HTMLElement) => {
  element.querySelectorAll('[data-pdf-ignore]').forEach((ignored) => ignored.remove());
};

export async function downloadReportPdf(
  element: HTMLElement,
  options: ReportPdfOptions
): Promise<void> {
  if (typeof document === 'undefined') {
    throw new Error('PDF generation is only supported in the browser.');
  }

  const html2pdf = (await import('html2pdf.js')).default;
  const clonedElement = element.cloneNode(true) as HTMLElement;
  removeIgnoredElements(clonedElement);

  const header = createHeaderElement(options);
  clonedElement.insertBefore(header, clonedElement.firstChild);

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'width:1200px;padding:16px;background-color:#ffffff;box-sizing:border-box;';
  wrapper.appendChild(clonedElement);
  document.body.appendChild(wrapper);

  try {
    const pdfOptions = {
      margin: options.margin ?? 10,
      filename: options.filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        orientation: options.orientation ?? 'portrait',
        unit: 'mm',
        format: options.format ?? 'a4',
      },
    };

    await html2pdf().set(pdfOptions).from(wrapper).save();
  } finally {
    document.body.removeChild(wrapper);
  }
}
