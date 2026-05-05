import { PrismaClient } from '../../src/generated/prisma/index.js';

/**
 * Seed Tracker - Maintains checkpoint system for idempotent seeding
 * Tracks which seeds have been successfully applied to avoid re-running them
 */

interface SeedCheckpoint {
  seedName: string;
  status: 'pending' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  recordsCreated: number;
  version: string;
}

const seedCheckpoints = new Map<string, SeedCheckpoint>();

export const initializeSeedCheckpoints = async (prisma: PrismaClient) => {
  seedCheckpoints.clear();

  const logs = await prisma.seedLog.findMany({ orderBy: { seedName: 'asc' } });
  logs.forEach((log) => {
    seedCheckpoints.set(log.seedName, {
      seedName: log.seedName,
      status: log.status as SeedCheckpoint['status'],
      startedAt: log.startedAt ?? undefined,
      completedAt: log.completedAt ?? undefined,
      error: log.error ?? undefined,
      recordsCreated: log.recordsCreated,
      version: log.version,
    });
  });
};

export const shouldSkipSeed = async (prisma: PrismaClient, seedName: string): Promise<boolean> => {
  const checkpoint = seedCheckpoints.get(seedName);
  if (checkpoint?.status === 'completed') {
    return true;
  }

  const log = await prisma.seedLog.findUnique({ where: { seedName } });
  if (log?.status === 'completed') {
    seedCheckpoints.set(seedName, {
      seedName,
      status: 'completed',
      startedAt: log.startedAt ?? undefined,
      completedAt: log.completedAt ?? undefined,
      error: log.error ?? undefined,
      recordsCreated: log.recordsCreated,
      version: log.version,
    });
    return true;
  }

  return false;
};

export const startSeed = async (prisma: PrismaClient, seedName: string): Promise<void> => {
  seedCheckpoints.set(seedName, {
    seedName,
    status: 'pending',
    startedAt: new Date(),
    recordsCreated: 0,
    version: '1.0',
  });

  await prisma.seedLog.upsert({
    where: { seedName },
    create: {
      seedName,
      status: 'pending',
      startedAt: new Date(),
      recordsCreated: 0,
      version: '1.0',
    },
    update: {
      status: 'pending',
      startedAt: new Date(),
      completedAt: null,
      error: null,
    },
  });
};

export const completeSeed = async (
  prisma: PrismaClient,
  seedName: string,
  recordsCreated: number = 0,
): Promise<void> => {
  const checkpoint = seedCheckpoints.get(seedName);
  if (checkpoint) {
    checkpoint.status = 'completed';
    checkpoint.completedAt = new Date();
    checkpoint.recordsCreated = recordsCreated;
  }

  await prisma.seedLog.upsert({
    where: { seedName },
    create: {
      seedName,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      recordsCreated,
      version: '1.0',
    },
    update: {
      status: 'completed',
      completedAt: new Date(),
      error: null,
      recordsCreated,
    },
  });
};

export const failSeed = async (prisma: PrismaClient, seedName: string, error: string): Promise<void> => {
  const checkpoint = seedCheckpoints.get(seedName);
  if (checkpoint) {
    checkpoint.status = 'failed';
    checkpoint.error = error;
    checkpoint.completedAt = new Date();
  }

  await prisma.seedLog.upsert({
    where: { seedName },
    create: {
      seedName,
      status: 'failed',
      startedAt: new Date(),
      completedAt: new Date(),
      error,
      recordsCreated: 0,
      version: '1.0',
    },
    update: {
      status: 'failed',
      completedAt: new Date(),
      error,
      recordsCreated: 0,
    },
  });
};

export const getAllCheckpoints = (): SeedCheckpoint[] => {
  return Array.from(seedCheckpoints.values());
};

export const printSeedStatusReport = (): void => {
  console.log('\n📊 SEED EXECUTION REPORT:');
  console.log('═══════════════════════════════════════════════════════════════');

  const checkpoints = getAllCheckpoints();
  let completedCount = 0;
  let failedCount = 0;
  let totalRecords = 0;

  checkpoints.forEach((cp) => {
    let status = '';
    if (cp.status === 'completed') {
      status = `✅ ${cp.seedName.padEnd(30)} - ${cp.recordsCreated} records`;
      completedCount++;
      totalRecords += cp.recordsCreated;
    } else if (cp.status === 'failed') {
      status = `❌ ${cp.seedName.padEnd(30)} - ${cp.error}`;
      failedCount++;
    } else {
      status = `⏳ ${cp.seedName.padEnd(30)} - Pending`;
    }
    console.log(status);
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📈 Summary: ${completedCount} completed, ${failedCount} failed`);
  console.log(`📊 Total records created: ${totalRecords}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
};
