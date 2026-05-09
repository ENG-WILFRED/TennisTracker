import { execSync } from 'child_process';
import * as path from 'path';

const schemaPath = process.env.PRISMA_SCHEMA || 'prisma/schema.prisma';
const resolvedSchema = path.resolve(process.cwd(), schemaPath);

function runCommand(command: string) {
  console.log(`> ${command}`);
  return execSync(command, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
  });
}

function deployMigrations() {
  console.log('Running prisma migrate deploy...');
  return runCommand(`npx prisma migrate deploy --schema ${JSON.stringify(resolvedSchema)}`);
}

function pushSchema() {
  console.log('Falling back to prisma db push...');
  return runCommand(`npx prisma db push --schema ${JSON.stringify(resolvedSchema)}`);
}

function main() {
  try {
    deployMigrations();
    console.log('✔ Prisma migrate deploy completed successfully.');
  } catch (error: any) {
    const stderr = error?.stderr?.toString() || String(error);
    if (stderr.includes('P3005')) {
      console.warn('⚠ Detected P3005: existing non-empty database without Prisma migration history.');
      console.warn('Using prisma db push as a fallback.');
      pushSchema();
      console.log('✔ Prisma db push completed successfully.');
      return;
    }

    if (stderr.includes('P3009')) {
      console.warn('⚠ Detected P3009: failed migrations found.');
      console.warn('Attempting to resolve failed migration...');
      try {
        // Mark the specific failed migration as applied
        runCommand(`npx prisma migrate resolve --applied 20260504205502_add_flexible_pricing --schema ${JSON.stringify(resolvedSchema)}`);
        console.log('✔ Marked failed migration as resolved.');
        // Try deploying again
        deployMigrations();
        console.log('✔ Prisma migrate deploy completed successfully after resolving failed migration.');
        return;
      } catch (resolveError) {
        console.error('Failed to resolve migration:', resolveError);
        console.error('Falling back to prisma db push...');
        pushSchema();
        console.log('✔ Prisma db push completed successfully.');
        return;
      }
    }

    console.error('Migration fallback script failed:');
    console.error(stderr);
    process.exit(1);
  }
}

main();
