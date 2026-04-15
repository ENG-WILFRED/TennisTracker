import fs from 'fs';
import path from 'path';

export interface StressReportConfig {
  testName: string;
  testType: string;
  baseUrl: string;
  concurrent: number;
  durationSeconds?: number;
  extraConfig?: Record<string, string | number | boolean>;
}

export interface StressReportBody {
  timestamp: string;
  config: StressReportConfig;
  metrics: Record<string, unknown>;
  errors?: Record<string, number>;
  timingSeries?: number[];
  notes?: string[];
}

const baseReportDirectory = path.join(process.cwd(), 'reports', 'stress');

function ensureDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function sanitize(value: unknown): unknown {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
  }
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitize(v)])
    );
  }
  return value;
}

function createHistogramSvg(values: number[], width = 700, height = 220): string {
  if (values.length === 0) {
    return `<div style="font-family:system-ui, sans-serif; margin: 12px 0; color:#374151;">No timing data available for graph.</div>`;
  }

  const bins = 10;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const counts = new Array<number>(bins).fill(0);

  for (const value of values) {
    const ratio = (value - min) / range;
    const index = Math.min(bins - 1, Math.floor(ratio * bins));
    counts[index]++;
  }

  const maxCount = Math.max(...counts, 1);
  const barWidth = width / bins;
  const barElements = counts
    .map((count, index) => {
      const barHeight = Math.round((count / maxCount) * (height - 40));
      return `
        <rect x="${index * barWidth + 3}" y="${height - 20 - barHeight}" width="${barWidth - 6}" height="${barHeight}" fill="#4f46e5" rx="4" />
        <text x="${index * barWidth + barWidth / 2}" y="${height - 4}" text-anchor="middle" font-size="10" fill="#374151">${count}</text>`;
    })
    .join('');

  const labels = new Array(bins).fill(0).map((_, index) => {
    const lower = min + (index * range) / bins;
    const upper = min + ((index + 1) * range) / bins;
    return `<text x="${index * barWidth + barWidth / 2}" y="${height - 26}" text-anchor="middle" font-size="10" fill="#6b7280">${Math.round(lower)}</text>`;
  }).join('');

  return `
    <svg width="${width}" height="${height}" role="img" aria-label="Timing histogram">
      <rect width="100%" height="100%" rx="16" fill="#f9fafb" />
      ${barElements}
      <line x1="0" y1="${height - 20}" x2="${width}" y2="${height - 20}" stroke="#cbd5e1" />
      ${labels}
    </svg>`;
}

function createStatusChart(results: Array<{ name: string; status: string; duration: number }>): string {
  const width = 700;
  const height = 240;
  const barHeight = 30;
  const gap = 14;
  const totalHeight = results.length * (barHeight + gap) + 40;
  const maxDuration = Math.max(...results.map(r => r.duration), 1);

  const bars = results
    .map((result, index) => {
      const ratio = result.duration / maxDuration;
      const barWidth = Math.max(4, ratio * (width - 180));
      const color = result.status === 'PASS' ? '#16a34a' : '#dc2626';
      return `
        <text x="8" y="${40 + index * (barHeight + gap) + 20}" font-size="12" fill="#111827">${result.name}</text>
        <rect x="180" y="${20 + index * (barHeight + gap)}" width="${barWidth}" height="20" rx="8" fill="${color}" />
        <text x="${190 + barWidth}" y="${40 + index * (barHeight + gap)}" font-size="12" fill="#111827">${(result.duration / 1000).toFixed(2)}s</text>`;
    })
    .join('');

  return `
    <svg width="${width}" height="${totalHeight}" role="img" aria-label="Test status chart">
      <rect width="100%" height="100%" rx="16" fill="#ffffff" stroke="#e5e7eb" />
      ${bars}
    </svg>`;
}

function renderHtml(report: StressReportBody): string {
  const metricsTable = Object.entries(report.metrics)
    .map(([key, value]) => `<tr><td>${key}</td><td>${String(value)}</td></tr>`)
    .join('');

  const errorRows = report.errors
    ? Object.entries(report.errors)
        .map(([message, count]) => `<tr><td>${message}</td><td>${count}</td></tr>`)
        .join('')
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${report.config.testName} Stress Test Report</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; margin: 24px; color: #111827; background: #f8fafc; }
    h1,h2,h3 { color:#111827; }
    .card { background:#ffffff; border:1px solid #e5e7eb; border-radius:20px; padding:20px; margin-bottom:20px; box-shadow:0 10px 30px rgba(15,23,42,0.05); }
    .small { color:#6b7280; font-size:0.95rem; }
    table { width:100%; border-collapse:collapse; margin-top:12px; }
    td { padding:10px 8px; border-bottom:1px solid #e5e7eb; }
    td:first-child { width:50%; font-weight:600; }
    .graph-label { margin:0 0 8px 0; }
  </style>
</head>
<body>
  <h1>${report.config.testName} Stress Test Report</h1>
  <p class="small">Generated at ${new Date(report.timestamp).toLocaleString()}</p>

  <div class="card">
    <h2>Configuration</h2>
    <table>
      <tr><td>Base URL</td><td>${report.config.baseUrl}</td></tr>
      <tr><td>Test Type</td><td>${report.config.testType}</td></tr>
      <tr><td>Concurrent</td><td>${report.config.concurrent}</td></tr>
      ${report.config.durationSeconds !== undefined ? `<tr><td>Duration (s)</td><td>${report.config.durationSeconds}</td></tr>` : ''}
      ${Object.entries(report.config.extraConfig || {}).map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`).join('')}
    </table>
  </div>

  <div class="card">
    <h2>Metrics</h2>
    <table>${metricsTable}</table>
  </div>

  ${report.timingSeries && report.timingSeries.length > 0 ? `
    <div class="card">
      <h2>Timing Graph</h2>
      ${createHistogramSvg(report.timingSeries)}
    </div>
  ` : ''}

  ${errorRows ? `<div class="card"><h2>Error Summary</h2><table>${errorRows}</table></div>` : ''}

  ${report.notes && report.notes.length > 0 ? `<div class="card"><h2>Notes</h2><ul>${report.notes.map(note => `<li>${note}</li>`).join('')}</ul></div>` : ''}
</body>
</html>`;
}

export function writeStressReport(reportConfig: StressReportConfig, metrics: Record<string, unknown>, errors: Record<string, number>, timingSeries: number[] = [], notes: string[] = []): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportName = `${reportConfig.testName}-${timestamp}`;
  const reportFolder = ensureDirectory(path.join(baseReportDirectory, reportName));

  const reportBody: StressReportBody = {
    timestamp: new Date().toISOString(),
    config: reportConfig,
    metrics: sanitize(metrics) as Record<string, unknown>,
    errors,
    timingSeries,
    notes,
  };

  const jsonPath = path.join(reportFolder, `${reportName}.json`);
  const mdPath = path.join(reportFolder, `${reportName}.md`);
  const htmlPath = path.join(reportFolder, `${reportName}.html`);
  const logPath = path.join(reportFolder, `${reportName}.log`);

  fs.writeFileSync(jsonPath, JSON.stringify(reportBody, sanitize, 2), 'utf8');

  const markdown = [`# ${reportConfig.testName} Stress Test Report`, ``, `**Generated:** ${reportBody.timestamp}`, ``, `## Configuration`, ``, `- Base URL: ${reportConfig.baseUrl}`, `- Test Type: ${reportConfig.testType}`, `- Concurrent: ${reportConfig.concurrent}`, ...(reportConfig.durationSeconds !== undefined ? [`- Duration (s): ${reportConfig.durationSeconds}`] : []), ...Object.entries(reportConfig.extraConfig || {}).map(([key, value]) => `- ${key}: ${value}`), ``, `## Metrics`, ``, ...Object.entries(reportBody.metrics).map(([key, value]) => `- **${key}**: ${String(value)}`), ``, `## Errors`, ``, ...(Object.entries(errors).length ? Object.entries(errors).map(([message, count]) => `- ${message}: ${count}`) : ['- None']), ``, `## Notes`, ``, ...(notes.length ? notes.map(note => `- ${note}`) : ['- None']), ``, `## Data File`, ``, `- JSON: ${path.basename(jsonPath)}`, `- HTML: ${path.basename(htmlPath)}`, `- Log: ${path.basename(logPath)}`].join('\n');

  fs.writeFileSync(mdPath, markdown, 'utf8');
  fs.writeFileSync(htmlPath, renderHtml(reportBody), 'utf8');
  fs.writeFileSync(logPath, markdown, 'utf8');
}
