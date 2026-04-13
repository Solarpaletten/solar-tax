// actions/tax-year.ts
"use server";

import { prisma } from "@/lib/db/client";
import { CreateTaxYearSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTaxYear(householdId: string, year: number) {
  const parsed = CreateTaxYearSchema.safeParse({ householdId, year });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Check for duplicate
  const existing = await prisma.taxYear.findUnique({
    where: { householdId_year: { householdId, year } },
  });
  if (existing) {
    return { error: `Tax year ${year} already exists for this household` };
  }

  const taxYear = await prisma.taxYear.create({
    data: {
      householdId: parsed.data.householdId,
      year: parsed.data.year,
      filingStatus: parsed.data.filingStatus,
    },
  });

  // Seed three default scenarios
  await prisma.scenario.createMany({
    data: [
      { taxYearId: taxYear.id, type: "CONSERVATIVE", name: "Conservative" },
      { taxYearId: taxYear.id, type: "BALANCED",     name: "Balanced"     },
      { taxYearId: taxYear.id, type: "AGGRESSIVE",   name: "Aggressive"   },
    ],
  });

  revalidatePath("/dashboard");
  return { data: taxYear };
}

export async function getTaxYearFull(id: string) {
  const taxYear = await prisma.taxYear.findUnique({
    where: { id },
    include: {
      household:    true,
      dependents:   { orderBy: { firstName: "asc" } },
      incomeItems:  { orderBy: { createdAt: "asc" } },
      expenseItems: { orderBy: { createdAt: "asc" } },
      scenarios:    { include: { result: true }, orderBy: { type: "asc" } },
      auditFlags:   { orderBy: { severity: "asc" } },
    },
  });
  return taxYear;
}

export async function updateTaxYearFilingStatus(id: string, filingStatus: string) {
  const taxYear = await prisma.taxYear.update({
    where: { id },
    data: { filingStatus },
  });
  revalidatePath(`/tax-year/${id}`);
  return { data: taxYear };
}

export async function deleteTaxYear(id: string, householdId: string) {
  await prisma.taxYear.delete({ where: { id } });
  revalidatePath("/dashboard");
}
