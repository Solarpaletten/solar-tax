// actions/income.ts
"use server";

import { prisma, ensureSchema } from "@/lib/db/client";
import { AddIncomeItemSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export async function addIncomeItem(input: {
  taxYearId: string;
  type: string;
  source: string;
  amount: string;
  withholding?: string;
  notes?: string;
}) {
  await ensureSchema();
  const parsed = AddIncomeItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const item = await prisma.incomeItem.create({
    data: {
      taxYearId:   parsed.data.taxYearId,
      type:        parsed.data.type,
      source:      parsed.data.source,
      amount:      parsed.data.amount,
      withholding: parsed.data.withholding ?? "0",
      notes:       parsed.data.notes,
    },
  });

  revalidatePath(`/tax-year/${parsed.data.taxYearId}`);
  return { data: item };
}

export async function deleteIncomeItem(id: string, taxYearId: string) {
  await ensureSchema();
  await prisma.incomeItem.delete({ where: { id } });
  revalidatePath(`/tax-year/${taxYearId}`);
}

export async function updateIncomeItem(id: string, input: {
  type?: string;
  source?: string;
  amount?: string;
  withholding?: string;
  notes?: string;
}) {
  await ensureSchema();
  const item = await prisma.incomeItem.update({
    where: { id },
    data: input,
  });
  revalidatePath(`/tax-year/${item.taxYearId}`);
  return { data: item };
}

export async function getTotalWithholding(taxYearId: string): Promise<number> {
  await ensureSchema();
  const items = await prisma.incomeItem.findMany({ where: { taxYearId } });
  return items.reduce((sum, item) => sum + parseFloat(item.withholding), 0);
}
