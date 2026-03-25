import { PrismaClient } from '../src/generated/prisma';
import assert from 'assert';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function getOrgMemberCounts() {
  const organizations = await prisma.organization.findMany({ select: { id: true, name: true } });
  const results: Array<{ id: string; name: string; memberCount: number }> = [];

  for (const org of organizations) {
    const memberCount = await prisma.clubMember.count({ where: { organizationId: org.id } });
    results.push({ id: org.id, name: org.name, memberCount });
  }

  return results;
}

async function main() {
  console.log('🧪 Checking member counts for all organizations...');

  const counts = await getOrgMemberCounts();
  counts.forEach((org) => {
    console.log(`- ${org.name} (${org.id}): ${org.memberCount} members`);
  });

  const someEmpty = counts.some((org) => org.memberCount === 0);

  if (someEmpty) {
    console.log('\n⚠️  Found org(s) with zero members, running seed pipeline...');

    try {
      execSync('npm run seed', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Seed pipeline failed', error);
      process.exit(1);
    }

    console.log('\n🔁 Re-checking member counts after seeding...');
    const rechecked = await getOrgMemberCounts();
    rechecked.forEach((org) => {
      console.log(`- ${org.name} (${org.id}): ${org.memberCount} members`);
      assert(org.memberCount > 0, `Organization ${org.name} still has no members`);
    });

    console.log('\n✅ All organizations now have members.');
  } else {
    console.log('\n✅ All organizations already have members.');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error in checkOrgMembers script:', e);
  prisma.$disconnect();
  process.exit(1);
});
