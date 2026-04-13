// actions/copy-year.ts
"use server";

import { prisma } from "@/lib/db/client";
import { revalidatePath } from "next/cache";

export interface CopyYearOptions {
  dependents:       boolean;
  expenseStructure: boolean; // categories + businessPct, amounts zeroed
  scenarioStructure: boolean; // copy 3 scenario types + overrides
}

export async function copyYear(
  sourceId: string,
  targetYear: number,
  options: CopyYearOptions
) {
  // 1. Validate source
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

  // 2. Check target year doesn't already exist
  const existing = await prisma.taxYear.findUnique({
    where: { householdId_year: { householdId: source.householdId, year: targetYear } },
  });
  if (existing) {
    return { error: `Tax year ${targetYear} already exists for this household` };
  }

  // 3. Create new TaxYear (inherits filingStatus)
  const newYear = await prisma.taxYear.create({
    data: {
      householdId:  source.householdId,
      year:         targetYear,
      filingStatus: source.filingStatus,
      notes:        `Copied from ${source.year}`,
    },
  });

  // 4. Copy dependents (same structure, no SSN)
  if (options.dependents && source.dependents.length > 0) {
    await prisma.dependent.createMany({
      data: source.dependents.map(({ id: _id, taxYearId: _ty, ...d }: any) => ({
        ...d,
        taxYearId: newYear.id,
      })),
    });
  }

  // 5. Copy expense structure (categories + businessPct, amounts = 0)
  if (options.expenseStructure && source.expenseItems.length > 0) {
    await prisma.expenseItem.createMany({
      data: source.expenseItems.map(({ id: _id, taxYearId: _ty, createdAt: _c, ...e }: any) => ({
        ...e,
        taxYearId: newYear.id,
        amount:    "0",           // zero out — user fills in new year amounts
        notes:     `From ${source.year}`,
      })),
    });
  }

  // 6. Seed income placeholders (same sources, zero amounts)
  if (source.incomeItems.length > 0) {
    await prisma.incomeItem.createMany({
      data: source.incomeItems.map(({ id: _id, taxYearId: _ty, createdAt: _c, ...i }: any) => ({
        ...i,
        taxYearId:   newYear.id,
        amount:      "0",
        withholding: "0",
        notes:       `From ${source.year}`,
      })),
    });
  }

  // 7. Copy scenario structure (overrides preserved, results cleared)
  if (options.scenarioStructure && source.scenarios.length > 0) {
    await prisma.scenario.createMany({
      data: source.scenarios.map(({ id: _id, taxYearId: _ty, createdAt: _c, updatedAt: _u, ...s }) => ({
        ...s,
        taxYearId: newYear.id,
        // Keep expense overrides (business % ratios are still valid)
        // Results will be recalculated when user opens scenarios
      })),
    });
  } else {
    // Seed default scenarios if not copying
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
    select:  {
      id:   true,
      year: true,
      _count: {
        select: { incomeItems: true, expenseItems: true, dependents: true },
      },
    },
  });
}
