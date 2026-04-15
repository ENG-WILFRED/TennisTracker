import { PrismaClient } from '@/generated/prisma';

const DEFAULT_CONNECTION_LIMIT = 10;
const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT ?? DEFAULT_CONNECTION_LIMIT);

function normalizeDatabaseUrl(url: string) {
  if (!url) return url;
  if (url.includes('?')) {
    return `${url}&connection_limit=${connectionLimit}`;
  }
  return `${url}?connection_limit=${connectionLimit}`;
}

const datasourceUrl = normalizeDatabaseUrl(process.env.DATABASE_URL || '');
const clientOptions = datasourceUrl
  ? {
      datasources: {
        db: {
          url: datasourceUrl,
        },
      },
    }
  : {};

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(clientOptions as any);
} else {
  // In development, use a global instance to avoid creating multiple instances
  const globalWithPrisma = global as typeof globalThis & {
    prisma: PrismaClient;
  };

  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient(clientOptions as any);
  }

  prisma = globalWithPrisma.prisma;
}

export default prisma;
