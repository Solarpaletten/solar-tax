// actions/dependents.ts
"use server";

import { prisma } from "@/lib/db/client";
import { AddDependentSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export async function addDependent(input: {
  taxYearId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: string;
  months?: number;
}) {
  const parsed = AddDependentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const dep = await prisma.dependent.create({
    data: {
      taxYearId:    parsed.data.taxYearId,
      firstName:    parsed.data.firstName,
      lastName:     parsed.data.lastName,
      dateOfBirth:  parsed.data.dateOfBirth,
      relationship: parsed.data.relationship,
      months:       parsed.data.months,
    },
  });

  revalidatePath(`/tax-year/${parsed.data.taxYearId}`);
  return { data: dep };
}

export async function deleteDependent(id: string, taxYearId: string) {
  await prisma.dependent.delete({ where: { id } });
  revalidatePath(`/tax-year/${taxYearId}`);
}
