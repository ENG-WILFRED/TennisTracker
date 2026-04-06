import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';

interface PDFOptions {
  filename: string;
  margin?: number;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  reportTitle?: string;
  reportDescription?: string;
  reportDate?: string;
}

export const usePDFDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { showToast } = useToast();

  const stripLabColorFunction = (styleStr: string): string => {
    // Replace all unsupported color functions with safe fallbacks
    return styleStr
      .replace(/lab\([^)]*\)/gi, '#333333')
      .replace(/oklch\([^)]*\)/gi, '#333333')
      .replace(/lch\([^)]*\)/gi, '#333333')
      .replace(/hwb\([^)]*\)/gi, '#333333');
  };

  const cleanComputedColors = (element: HTMLElement) => {
    // Get computed style and create a white-list of safe properties
    const computed = window.getComputedStyle(element);
    const safeProperties = [
      'color', 'backgroundColor', 'borderColor', 'outlineColor',
      'textDecorationColor', 'caretColor', 'accentColor'
    ];

    safeProperties.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value && (value.includes('lab(') || value.includes('oklch(') || value.includes('lch(') || value.includes('hwb('))) {
        (element.style as any)[prop] = '#333333';
      }
    });
  };

  const cleanElementStyles = (element: HTMLElement) => {
    // Process inline styles
    const style = element.getAttribute('style');
    if (style) {
      const cleanedStyle = stripLabColorFunction(style);
      element.setAttribute('style', cleanedStyle);
    }

    // Also clean computed styles to catch any CSS-generated lab() colors
    try {
      cleanComputedColors(element);
    } catch (_e) {
      // Ignore errors from computed style access
    }
  };

  const createPDFHeader = (options: PDFOptions): HTMLElement | null => {
    if (!options.reportTitle) return null;

    const header = document.createElement('div');
    header.className = 'pdf-report-header';
    header.style.cssText = `
      background-color: #f0f9ff;
      color: #0f172a;
      padding: 2.5rem 2rem;
      margin-bottom: 2rem;
      border-radius: 0.75rem;
      border: 2px solid #bae6fd;
      border-left: 6px solid #0ea5e9;
      page-break-after: avoid;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
    `;

    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    `;

    // Icon/badge
    const badge = document.createElement('div');
    badge.style.cssText = `
      background-color: #0ea5e9;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      flex-shrink: 0;
      color: white;
    `;
    badge.textContent = 'REPORT';
    titleContainer.appendChild(badge);

    const titleEl = document.createElement('h1');
    titleEl.style.cssText = `
      font-size: 2.25rem;
      font-weight: 800;
      margin: 0;
      color: #0f172a;
      letter-spacing: -0.02em;
    `;
    titleEl.textContent = options.reportTitle;
    titleContainer.appendChild(titleEl);

    header.appendChild(titleContainer);

    // Divider
    const divider = document.createElement('div');
    divider.style.cssText = `
      height: 2px;
      background: linear-gradient(to right, #0ea5e9, #06b6d4, transparent);
      margin: 1rem 0 1rem 0;
    `;
    header.appendChild(divider);

    if (options.reportDescription) {
      const descEl = document.createElement('p');
      descEl.style.cssText = `
        font-size: 1rem;
        margin: 0.75rem 0 1rem 0;
        color: #475569;
        line-height: 1.5;
      `;
      descEl.textContent = options.reportDescription;
      header.appendChild(descEl);
    }

    if (options.reportDate) {
      const dateEl = document.createElement('p');
      dateEl.style.cssText = `
        font-size: 0.875rem;
        margin: 0;
        color: #64748b;
        font-weight: 500;
      `;
      dateEl.textContent = `📅 ${options.reportDate}`;
      header.appendChild(dateEl);
    } else {
      const dateEl = document.createElement('p');
      dateEl.style.cssText = `
        font-size: 0.875rem;
        margin: 0;
        color: #64748b;
        font-weight: 500;
      `;
      dateEl.textContent = `📅 ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      header.appendChild(dateEl);
    }

    return header;
  };

  const injectStylesForPDF = (doc: HTMLElement) => {
    // Create a comprehensive style sheet for PDF rendering
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-pdf-styles', 'true');
    styleElement.textContent = `
      /* Force exact color rendering for PDF */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      /* Disable gradients that use lab() colors for PDF */
      [style*="background"] {
        background: none !important;
        background-color: #ffffff !important;
      }

      /* Tailwind color utilities */
      .text-emerald-600 { color: #059669 !important; }
      .text-blue-600 { color: #2563eb !important; }
      .text-purple-600 { color: #9333ea !important; }
      .text-orange-600 { color: #ea580c !important; }
      .text-gray-900 { color: #111827 !important; }
      .text-gray-600 { color: #4b5563 !important; }
      .text-gray-700 { color: #374151 !important; }
      .text-gray-500 { color: #6b7280 !important; }
      .text-white { color: white !important; }
      .text-emerald-100 { color: #d1fae5 !important; }
      .text-blue-100 { color: #dbeafe !important; }
      .text-blue-900 { color: #1e3a8a !important; }
      .text-purple-900 { color: #581c87 !important; }

      /* Tailwind background utilities */
      .bg-white { background-color: white !important; }
      .bg-gray-50 { background-color: #fafafa !important; }
      .bg-gray-100 { background-color: #f3f4f6 !important; }
      .bg-emerald-50 { background-color: #f0fdf4 !important; }
      .bg-blue-50 { background-color: #eff6ff !important; }
      .bg-purple-50 { background-color: #faf5ff !important; }
      .bg-orange-50 { background-color: #fff7ed !important; }
      .bg-emerald-100 { background-color: #d1fae5 !important; }
      .bg-emerald-600 { background-color: #059669 !important; }
      .bg-blue-600 { background-color: #2563eb !important; }

      /* Remove problematic gradient classes */
      .bg-gradient-to-r,
      .bg-gradient-to-b,
      .bg-gradient-to-l,
      .bg-gradient-to-t {
        background: inherit !important;
      }

      /* Tailwind border utilities */
      .border { border: 1px solid #e5e7eb !important; }
      .border-2 { border: 2px solid #e5e7eb !important; }
      .border-gray-200 { border-color: #e5e7eb !important; }
      .border-emerald-200 { border-color: #a7f3d0 !important; }
      .border-blue-200 { border-color: #bfdbfe !important; }
      .border-purple-200 { border-color: #e9d5ff !important; }
      .border-orange-200 { border-color: #fed7aa !important; }
      .border-gray-300 { border-color: #d1d5db !important; }
      .border-white { border-color: white !important; }

      /* Tailwind shadow utilities */
      .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important; }
      .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important; }
      .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important; }
      .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; }

      /* Tailwind border radius */
      .rounded-lg { border-radius: 0.5rem !important; }
      .rounded-full { border-radius: 9999px !important; }
      .rounded-b-lg { border-bottom-left-radius: 0.5rem !important; border-bottom-right-radius: 0.5rem !important; }

      /* Tailwind spacing */
      .p-3 { padding: 0.75rem !important; }
      .p-4 { padding: 1rem !important; }
      .p-6 { padding: 1.5rem !important; }
      .p-8 { padding: 2rem !important; }
      .px-3 { padding-left: 0.75rem; padding-right: 0.75rem !important; }
      .px-4 { padding-left: 1rem; padding-right: 1rem !important; }
      .px-6 { padding-left: 1.5rem; padding-right: 1.5rem !important; }
      .px-8 { padding-left: 2rem; padding-right: 2rem !important; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem !important; }
      .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem !important; }
      .py-4 { padding-top: 1rem; padding-bottom: 1rem !important; }
      .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem !important; }
      .mb-2 { margin-bottom: 0.5rem !important; }
      .mb-3 { margin-bottom: 0.75rem !important; }
      .mt-1 { margin-top: 0.25rem !important; }
      .mt-2 { margin-top: 0.5rem !important; }
      .gap-2 { gap: 0.5rem !important; }
      .gap-3 { gap: 0.75rem !important; }
      .gap-4 { gap: 1rem !important; }
      .gap-6 { gap: 1.5rem !important; }

      /* Tailwind typography */
      .text-sm { font-size: 0.875rem; line-height: 1.25rem !important; }
      .text-xs { font-size: 0.75rem; line-height: 1rem !important; }
      .font-bold { font-weight: 700 !important; }
      .font-semibold { font-weight: 600 !important; }
      .font-medium { font-weight: 500 !important; }

      /* Layouts */
      .grid { display: grid !important; }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
      .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
      .gap-4 { gap: 1rem !important; }
      .col-span-2 { grid-column: span 2 / span 2 !important; }
      
      .flex { display: flex !important; }
      .items-center { align-items: center !important; }
      .items-start { align-items: flex-start !important; }
      .justify-between { justify-content: space-between !important; }
      .flex-1 { flex: 1 1 0% !important; }
      .flex-shrink-0 { flex-shrink: 0 !important; }

      /* Visibility */
      .space-y-2 > * + * { margin-top: 0.5rem !important; }
      .space-y-4 > * + * { margin-top: 1rem !important; }
      .space-y-6 > * + * { margin-top: 1.5rem !important; }
      .space-y-8 > * + * { margin-top: 2rem !important; }

      /* Overflow */
      .overflow-hidden { overflow: hidden !important; }

      /* Page breaks for PDF */
      .page-break { page-break-after: always !important; }

      /* Override any computed lab() colors */
      * {
        filter: none !important;
      }

      /* Ensure all backgrounds are solid colors */
      div[style*="background"],
      span[style*="background"],
      p[style*="background"] {
        background-image: none !important;
      }

      /* Additional color fixes for common Tailwind utilities */
      [class*="pink"] { color: #ec4899 !important; }
      [class*="rose"] { color: #f43f5e !important; }
      [class*="red"] { color: #ef4444 !important; }
      [class*="orange"] { color: #f97316 !important; }
      [class*="yellow"] { color: #eab308 !important; }
      [class*="lime"] { color: #84cc16 !important; }
      [class*="green"] { color: #22c55e !important; }
      [class*="teal"] { color: #14b8a6 !important; }
      [class*="cyan"] { color: #06b6d4 !important; }
      [class*="indigo"] { color: #6366f1 !important; }
      [class*="violet"] { color: #8b5cf6 !important; }

      /* PDF Report Header Styling */
      .pdf-report-header {
        background-color: #f0f9ff !important;
        color: #0f172a !important;
        padding: 2.5rem 2rem !important;
        margin-bottom: 2rem !important;
        border-radius: 0.75rem !important;
        border: 2px solid #bae6fd !important;
        border-left: 6px solid #0ea5e9 !important;
        page-break-after: avoid !important;
        display: block !important;
      }

      .pdf-report-header h1 {
        font-size: 2.25rem !important;
        font-weight: 800 !important;
        margin: 0 !important;
        color: #0f172a !important;
        letter-spacing: -0.02em !important;
      }

      .pdf-report-header p {
        color: #64748b !important;
        margin: 0.75rem 0 0 0 !important;
        font-weight: 500 !important;
      }

      .pdf-report-header div {
        color: #0f172a !important;
      }
    `;
    
    doc.insertBefore(styleElement, doc.firstChild);
  };

  const downloadPDF = async (
    element: HTMLElement,
    options: PDFOptions
  ): Promise<void> => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      showToast('Starting PDF download...', 'info');
      
      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      
      if (!element) {
        showToast('Failed to generate PDF', 'error');
        return;
      }

      setDownloadProgress(20);

      const pdfOptions = {
        margin: options.margin || 10,
        filename: options.filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          letterRendering: true,
          onclone: (clonedDocument: Document) => {
            const clonedElement = clonedDocument.body.querySelector('[data-pdf-content]') as HTMLElement;
            if (clonedElement) {
              // Remove all gradient classes that might use lab()
              const allElements = clonedElement.querySelectorAll('[class*="gradient"], [class*="from-"], [class*="to-"], [class*="via-"]');
              allElements.forEach((el) => {
                const elem = el as HTMLElement;
                const classList = Array.from(elem.classList);
                classList.forEach(cls => {
                  if (cls.includes('gradient') || cls.includes('from-') || cls.includes('to-') || cls.includes('via-')) {
                    elem.classList.remove(cls);
                  }
                });
                // Ensure no background gradients
                elem.style.background = 'none';
                elem.style.backgroundImage = 'none';
              });
              
              injectStylesForPDF(clonedElement);
            }
          }
        },
        jsPDF: { 
          orientation: options.orientation || 'portrait' as const, 
          unit: 'mm' as const, 
          format: options.format || 'a4' as const 
        },
      };

      setDownloadProgress(40);
      showToast('Processing document...', 'info');

      // Clone the element and inject styles
      const cloneElement = element.cloneNode(true) as HTMLElement;
      cloneElement.setAttribute('data-pdf-content', 'true');
      
      // Clean lab() colors from all elements recursively
      const allElements = cloneElement.querySelectorAll('*');
      allElements.forEach((el) => {
        cleanElementStyles(el as HTMLElement);
      });
      cleanElementStyles(cloneElement);
      
      // Remove gradient background elements
      const gradients = cloneElement.querySelectorAll('[class*="bg-gradient"], [class*="from-"], [class*="to-"], [class*="via-"]');
      gradients.forEach((el) => {
        const elem = el as HTMLElement;
        const classList = Array.from(elem.classList);
        classList.forEach(cls => {
          if (cls.includes('gradient') || cls.includes('from-') || cls.includes('to-') || cls.includes('via-')) {
            elem.classList.remove(cls);
          }
        });
        elem.style.background = 'none';
        elem.style.backgroundImage = 'none';
      });
      
      // Inject comprehensive styles
      injectStylesForPDF(cloneElement);

      // Create and prepend PDF header if title is provided
      const headerElement = createPDFHeader(options);
      if (headerElement) {
        cleanElementStyles(headerElement);
        cloneElement.insertBefore(headerElement, cloneElement.firstChild);
      }
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '1200px';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '0';
      tempContainer.appendChild(cloneElement);
      document.body.appendChild(tempContainer);

      setDownloadProgress(60);
      showToast('Converting to PDF...', 'info');
      
      html2pdf()
        .set(pdfOptions)
        .from(cloneElement)
        .save()
        .then(() => {
          setDownloadProgress(100);
          showToast('PDF downloaded successfully!', 'success');
        })
        .catch((error: unknown) => {
          console.error('PDF generation error:', error);
          showToast('Failed to generate PDF', 'error');
        })
        .finally(() => {
          document.body.removeChild(tempContainer);
          setTimeout(() => {
            setIsDownloading(false);
            setDownloadProgress(0);
          }, 500);
        });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsDownloading(false);
      setDownloadProgress(0);
      showToast('Failed to generate PDF', 'error');
    }
  };

  return {
    isDownloading,
    downloadProgress,
    downloadPDF,
  };
};
