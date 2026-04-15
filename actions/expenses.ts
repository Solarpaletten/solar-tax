// actions/expenses.ts s
"use server";

import { prisma, ensureSchema } from "@/lib/db/client";
import { AddExpenseItemSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export async function addExpenseItem(input: {
  taxYearId:    string;
  category:     string;
  description:  string;
  amount:       string | number;
  businessPct?: number;
  notes?:       string;
}) {
  await ensureSchema();
  const parsed = AddExpenseItemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const item = await prisma.expenseItem.create({
    data: {
      taxYearId:   parsed.data.taxYearId,
      category:    parsed.data.category,
      description: parsed.data.description,
      amount:      parseFloat(String(parsed.data.amount)) || 0,
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
  category?:    string;
  description?: string;
  amount?:      string | number;
  businessPct?: number;
  notes?:       string;
}) {
  await ensureSchema();
  const data: any = { ...input };
  if (input.amount !== undefined) data.amount = parseFloat(String(input.amount)) || 0;
  const item = await prisma.expenseItem.update({ where: { id }, data });
  revalidatePath(`/tax-year/${item.taxYearId}`);
  return { data: item };
}
