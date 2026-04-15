// actions/copy-year.ts s
"use server";

import { prisma } from "@/lib/db/client";
import { revalidatePath } from "next/cache";

export interface CopyYearOptions {
  dependents:        boolean;
  expenseStructure:  boolean;
  scenarioStructure: boolean;
}

export async function copyYear(
  sourceId: string,
  targetYear: number,
  options: CopyYearOptions
) {
  const source = await prisma.taxYear.findUniqueOrThrow({
    where: { id: sourceId },
    include: {
      household:    true,
      dependents:   true,
      incomeItems:  true,
      expenseItems: true,
      scenarios:    true,
    },
  });

  // Use findFirst with version=1 — old householdId_year unique key is gone
  const existing = await prisma.taxYear.findFirst({
    where: { householdId: source.householdId, year: targetYear, version: 1 },
  });
  if (existing) {
    return { error: `Tax year ${targetYear} already exists for this household` };
  }

  const newYear = await prisma.taxYear.create({
    data: {
      householdId:  source.householdId,
      year:         targetYear,
      filingStatus: source.filingStatus,
      version:      1,
      filingType:   "ORIGINAL",
      notes:        `Copied from ${source.year}`,
    },
  });

  if (options.dependents && source.dependents.length > 0) {
    await prisma.dependent.createMany({
      data: source.dependents.map(({ id: _id, taxYearId: _ty, ...d }: any) => ({
        ...d, taxYearId: newYear.id,
      })),
    });
  }

  if (options.expenseStructure && source.expenseItems.length > 0) {
    await prisma.expenseItem.createMany({
      data: source.expenseItems.map(({ id: _id, taxYearId: _ty, createdAt: _c, ...e }: any) => ({
        ...e,
        taxYearId: newYear.id,
        amount:    0,  // Float zero
        notes:     `From ${source.year}`,
      })),
    });
  }

  if (source.incomeItems.length > 0) {
    await prisma.incomeItem.createMany({
      data: source.incomeItems.map(({ id: _id, taxYearId: _ty, createdAt: _c, ...i }: any) => ({
        ...i,
        taxYearId:   newYear.id,
        amount:      0,  // Float zero
        withholding: 0,  // Float zero
        notes:       `From ${source.year}`,
      })),
    });
  }

  if (options.scenarioStructure && source.scenarios.length > 0) {
    await prisma.scenario.createMany({
      data: source.scenarios.map(({ id: _id, taxYearId: _ty, createdAt: _c, updatedAt: _u, ...s }: any) => ({
        ...s, taxYearId: newYear.id,
      })),
    });
  } else {
    await prisma.scenario.createMany({
      data: [
        { taxYearId: newYear.id, type: "CONSERVATIVE", name: "Conservative" },
        { taxYearId: newYear.id, type: "BALANCED",     name: "Balanced"     },
        { taxYearId: newYear.id, type: "AGGRESSIVE",   name: "Aggressive"   },
      ],
    });
  }

  revalidatePath("/dashboard");
  return { data: newYear };
}

export async function getSourceYears(householdId: string) {
  return prisma.taxYear.findMany({
    where:   { householdId },
    orderBy: { year: "desc" },
    select: {
      id:   true,
      year: true,
      _count: {
        select: { incomeItems: true, expenseItems: true, dependents: true },
      },
    },
  });
}
