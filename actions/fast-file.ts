// actions/fast-file.ts
"use server";

import { prisma, ensureSchema } from "@/lib/db/client";
import { runAllScenarios } from "./scenario";

export async function importPreviousYear(taxYearId: string) {
  await ensureSchema();

  const current = await prisma.taxYear.findUniqueOrThrow({
    where: { id: taxYearId },
    include: { household: true },
  });

  const prev = await prisma.taxYear.findFirst({
    where: {
      householdId: current.householdId,
      year: current.year - 1,
    },
    include: {
      incomeItems:  true,
      expenseItems: true,
      dependents:   true,
    },
  });

  if (!prev) return { error: `No data found for ${current.year - 1}` };

  // Copy income items (zero amounts — user confirms)
  await prisma.incomeItem.deleteMany({ where: { taxYearId } });
  if (prev.incomeItems.length > 0) {
    await prisma.incomeItem.createMany({
      data: prev.incomeItems.map(({ id: _id, taxYearId: _ty, createdAt: _c, ...i }: any) => ({
        ...i, taxYearId, amount: i.amount, withholding: i.withholding,
      })),
    });
  }

  // Copy expense items
  await prisma.expenseItem.deleteMany({ where: { taxYearId } });
  if (prev.expenseItems.length > 0) {
    await prisma.expenseItem.createMany({
      data: prev.expenseItems.map(({ id: _id, taxYearId: _ty, createdAt: _c, ...e }: any) => ({
        ...e, taxYearId,
      })),
    });
  }

  // Copy dependents
  await prisma.dependent.deleteMany({ where: { taxYearId } });
  if (prev.dependents.length > 0) {
    await prisma.dependent.createMany({
      data: prev.dependents.map(({ id: _id, taxYearId: _ty, ...d }: any) => ({
        ...d, taxYearId,
      })),
    });
  }

  // Run calculations
  await runAllScenarios(taxYearId);

  return { success: true, year: prev.year };
}

export async function quickCalculate(taxYearId: string) {
  await ensureSchema();
  await runAllScenarios(taxYearId);
  return { success: true };
}
