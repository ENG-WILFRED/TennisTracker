// helper for uploading media files to Cloudflare R2
// you'll need to set environment variables:
// R2_ACCOUNT_ID, R2_BUCKET, R2_API_TOKEN (or use AWS_KEY/AWS_SECRET with S3 endpoint)

const R2_ACCOUNT = process.env.R2_ACCOUNT_ID;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_API_TOKEN = process.env.R2_API_TOKEN;

if (!R2_ACCOUNT || !R2_BUCKET || !R2_API_TOKEN) {
  // in development we might not have these configured; upload calls will throw
}

const R2_ENDPOINT = R2_ACCOUNT
  ? `https://${R2_ACCOUNT}.r2.cloudflarestorage.com`
  : '';

export async function uploadToR2(
  key: string,
  data: Buffer | ArrayBuffer | Blob | ReadableStream,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  if (!R2_ENDPOINT) {
    throw new Error('R2 configuration missing');
  }
  const url = `${R2_ENDPOINT}/${R2_BUCKET}/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      Authorization: `Bearer ${R2_API_TOKEN}`,
    },
    body: data as any,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed: ${res.status} ${res.statusText} ${text}`);
  }
  // assume public bucket or use signed url technique
  return url;
}

export function getR2Url(key: string): string {
  if (!R2_ENDPOINT) {
    throw new Error('R2 configuration missing');
  }
  return `${R2_ENDPOINT}/${R2_BUCKET}/${encodeURIComponent(key)}`;
}
