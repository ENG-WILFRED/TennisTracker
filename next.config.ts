import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Some generated files (e.g. Prisma client) produce lint warnings/errors
    // Allow builds to succeed and address linting separately.
    ignoreDuringBuilds: true,
  },
  skipTrailingSlashRedirect: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 60 seconds
    pagesBufferLength: 5,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;