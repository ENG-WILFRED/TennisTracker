import { NextRequest, NextResponse } from 'next/server';
import rateLimiter, { MAX_REQUESTS, WINDOW_MS } from '@/lib/rateLimiter';

export function middleware(req: NextRequest) {
  const start = Date.now();
  const ip =
    (req.headers.get('cf-connecting-ip') as string) ||
    (req.headers.get('x-forwarded-for') as string) ||
    (req.headers.get('x-real-ip') as string) ||
    'unknown';

  if (rateLimiter.isRateLimited(ip)) {
    const response = new NextResponse('Too Many Requests', { status: 429 });
    response.headers.set('Retry-After', String(Math.ceil(WINDOW_MS / 1000)));
    response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    response.headers.set('X-RateLimit-Remaining', String(rateLimiter.getRemaining(ip)));
    response.headers.set('X-Response-Time', `${Date.now() - start}ms`);
    return response;
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

  res.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
  res.headers.set('X-RateLimit-Remaining', String(rateLimiter.getRemaining(ip)));
  res.headers.set('X-Response-Time', `${Date.now() - start}ms`);

  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
