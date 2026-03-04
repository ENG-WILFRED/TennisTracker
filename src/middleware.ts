import { NextRequest, NextResponse } from 'next/server';
import rateLimiter from '@/lib/rateLimiter';

export function middleware(req: NextRequest) {
  // Basic per-IP rate limiting (per-instance). For scale, use Cloudflare rate
  // limiting rules or a shared KV store.
  const ip =
    (req.headers.get('cf-connecting-ip') as string) ||
    (req.headers.get('x-forwarded-for') as string) ||
    (req.headers.get('x-real-ip') as string) ||
    'unknown';
  if (rateLimiter.isRateLimited(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const res = NextResponse.next();

  // Security headers (recommended). When deployed behind Cloudflare these
  // should be augmented with Cloudflare firewall rules and DDoS protection.
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', "geolocation=()",);
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https:;");

  // Add cache caching hints for Cloudflare. Individual API routes may override.
  // Default: no-store for dynamic routes unless explicitly set.
  if (!res.headers.get('Cache-Control')) {
    res.headers.set('Cache-Control', 'no-store');
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*', '/(.*)'],
};
