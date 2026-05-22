#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

async function getStatusCounts() {
  const rows = await prisma.court.findMany({ select: { status: true } });
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const s = r.status ?? 'NULL';
    counts[s] = (counts[s] || 0) + 1;
  }
  return counts;
}

function prompt(question: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<string>((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  try {
    console.log('\n=== Court Status Normalization ===\n');

    const before = await getStatusCounts();
    console.log('Current status distribution:');
    for (const k of Object.keys(before).sort()) console.log(`  ${k}: ${before[k]}`);

    // Default mapping: normalize common variants to 'Active'
    const variantsToNormalize = ['available', 'Available', 'active', 'Active'];

    // Ask for confirmation unless CONFIRM=true or --yes provided
    const autoConfirm = process.env.CONFIRM === 'true' || process.argv.includes('--yes');
    if (!autoConfirm) {
      const answer = (await prompt('\nProceed to update courts with status in ' + JSON.stringify(variantsToNormalize) + " to 'Active'? Type YES to continue: ")) || '';
      if (answer.trim() !== 'YES') {
        console.log('Aborting - no changes made.');
        process.exit(0);
      }
    }

    console.log('\nUpdating courts...');
    const result = await prisma.court.updateMany({
      where: { status: { in: variantsToNormalize } },
      data: { status: 'Active' },
    });

    console.log(`Updated ${result.count} court(s).`);

    const after = await getStatusCounts();
    console.log('\nStatus distribution after update:');
    for (const k of Object.keys(after).sort()) console.log(`  ${k}: ${after[k]}`);

    console.log('\nDone.');
  } catch (err: any) {
    console.error('Error running normalization script:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
