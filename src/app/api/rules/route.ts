import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function GET() {
  try {
    const rules = await prisma.tennisRule.findMany({
      select: {
        id: true,
        category: true,
        label: true,
        value: true,
      },
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    });

    // Group rules by category
    const groupedRules: Record<string, Array<{ label: string; value?: string | null }>> = {};
    rules.forEach((rule: any) => {
      if (!groupedRules[rule.category]) {
        groupedRules[rule.category] = [];
      }
      groupedRules[rule.category].push({
        label: rule.label,
        value: rule.value,
      });
    });

    return NextResponse.json(groupedRules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}
