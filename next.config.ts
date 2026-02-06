import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Some generated files (e.g. Prisma client) produce lint warnings/errors
    // Allow builds to succeed and address linting separately.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
