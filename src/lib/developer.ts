export const DEVELOPER_EMAILS = new Set([
  'vicotennis0@gmail.com',
  'kimaniwilfred95@gmail.com',
]);

export function isDeveloperEmail(email?: string | null) {
  if (!email) return false;
  return DEVELOPER_EMAILS.has(String(email).trim().toLowerCase());
}

export function getOtherDeveloperEmail(email?: string | null) {
  if (!email) return null;
  const normalized = String(email).trim().toLowerCase();
  if (!DEVELOPER_EMAILS.has(normalized)) return null;
  for (const devEmail of DEVELOPER_EMAILS) {
    if (devEmail !== normalized) {
      return devEmail;
    }
  }
  return null;
}

export function generateOtpCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
