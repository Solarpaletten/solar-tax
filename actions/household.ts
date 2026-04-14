"use server";
import { prisma, ensureSchema } from "@/lib/db/client";
import { CreateHouseholdSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export async function createHousehold(name: string) {
  await ensureSchema();
  const parsed = CreateHouseholdSchema.safeParse({ name });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const household = await prisma.household.create({ data: { name: parsed.data.name } });
  revalidatePath("/dashboard");
  return { data: household };
}

export async function getHouseholds() {
  await ensureSchema();
  return prisma.household.findMany({
    include: { taxYears: { orderBy: { year: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteHousehold(id: string) {
  await ensureSchema();
  await prisma.household.delete({ where: { id } });
  return { ok: true };
}
