// actions/expenses.ts
"use server";

import { prisma, ensureSchema } from "@/lib/db/client";
import { AddExpenseItemSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export async function addExpenseItem(input: {
  taxYearId: string;
  category: string;
  description: string;
  amount: string;
  businessPct?: number;
  notes?: string;
}) {
  await ensureSchema();
  const parsed = AddExpenseItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const item = await prisma.expenseItem.create({
    data: {
      taxYearId:   parsed.data.taxYearId,
      category:    parsed.data.category,
      description: parsed.data.description,
      amount:      parsed.data.amount,
      businessPct: parsed.data.businessPct,
      notes:       parsed.data.notes,
    },
  });

  revalidatePath(`/tax-year/${parsed.data.taxYearId}`);
  return { data: item };
}

export async function deleteExpenseItem(id: string, taxYearId: string) {
  await ensureSchema();
  await prisma.expenseItem.delete({ where: { id } });
  revalidatePath(`/tax-year/${taxYearId}`);
}

export async function updateExpenseItem(id: string, input: {
  category?: string;
  description?: string;
  amount?: string;
  businessPct?: number;
  notes?: string;
}) {
  await ensureSchema();
  const item = await prisma.expenseItem.update({
    where: { id },
    data: input,
  });
  revalidatePath(`/tax-year/${item.taxYearId}`);
  return { data: item };
}
