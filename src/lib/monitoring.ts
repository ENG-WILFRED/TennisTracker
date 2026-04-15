import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, `server-performance-${new Date().toISOString().slice(0, 10)}.log`);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function writeLog(entry: string) {
  if (process.env.ENABLE_SERVER_MONITORING !== 'true') return;
  const timestamped = `[${new Date().toISOString()}] ${entry}`;
  fs.appendFileSync(logFile, `${timestamped}\n`);
}

export function recordEndpointMetrics(route: string, method: string, status: number, durationMs: number) {
  const message = `${method} ${route} status=${status} duration=${durationMs}ms`;
  writeLog(message);
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[PERF] ${message}`);
  }
}
