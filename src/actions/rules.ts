'use server';

import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export interface Rule {
  label: string;
  value?: string | null;
}

export interface RulesGrouped {
  [category: string]: Rule[];
}

export async function getRules(): Promise<RulesGrouped> {
  try {
    const rules = await prisma.tennisRule.findMany({
      select: {
        category: true,
        label: true,
        value: true,
      },
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    });

    const groupedRules: RulesGrouped = {};
    rules.forEach((rule: any) => {
      if (!groupedRules[rule.category]) {
        groupedRules[rule.category] = [];
      }
      groupedRules[rule.category].push({
        label: rule.label,
        value: rule.value,
      });
    });

    return groupedRules;
  } catch (error) {
    console.error('Error fetching rules:', error);
    return {};
  }
}

export async function getRulesByCategory(category: string): Promise<Rule[]> {
  try {
    const rules = await prisma.tennisRule.findMany({
      where: { category },
      select: {
        label: true,
        value: true,
      },
      orderBy: { label: 'asc' },
    });

    return rules;
  } catch (error) {
    console.error(`Error fetching rules for category ${category}:`, error);
    return [];
  }
}
