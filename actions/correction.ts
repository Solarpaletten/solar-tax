"use server";
// actions/correction.ts — Correction Flow
// Creates version+1 of a TaxYear (amendment).
// Uses (prisma as any) casts because Prisma client is generated server-side
// with the new schema fields (version, parentId, filingType). s

import { prisma } from "@/lib/db/client";
import { revalidatePath } from "next/cache";

const db = prisma as any; // schema fields added — client regenerated on deploy

export interface CorrectionResult {
  data?: { id: string; version: number; year: number };
  error?: string;
}

export async function createCorrection(sourceId: string): Promise<CorrectionResult> {
  // 1. Load source with all related data
  const source = await db.taxYear.findUnique({
    where: { id: sourceId },
    include: {
      dependents:   true,
      incomeItems:  true,
      expenseItems: true,
      scenarios:    true,
    },
  });

  if (!source) return { error: "Tax year not found" };

  // 2. Get current max version for this household+year
  const existing = await db.taxYear.findMany({
    where:   { householdId: source.householdId, year: source.year },
    select:  { version: true },
    orderBy: { version: "desc" },
  });
  const maxVersion = (existing[0]?.version as number) ?? 1;
  const newVersion = maxVersion + 1;

  // 3. Create amended TaxYear
  const amended = await db.taxYear.create({
    data: {
      householdId:  source.householdId,
      year:         source.year,
      filingStatus: source.filingStatus,
      state:        source.state,
      version:      newVersion,
      parentId:     sourceId,
      filingType:   "AMENDED",
      notes:        `Correction of v${source.version ?? 1} — ${new Date().toLocaleDateString("en-US")}`,
      // Must re-sign amended return
      signed8879:   false,
    },
  });

  // 4. Copy dependents
  if (source.dependents.length > 0) {
    await db.dependent.createMany({
      data: source.dependents.map(({ id: _id, taxYearId: _ty, ...d }: any) => ({
        ...d,
        taxYearId: amended.id,
      })),
    });
  }

  // 5. Copy income items (amounts preserved)
  if (source.incomeItems.length > 0) {
    await db.incomeItem.createMany({
      data: source.incomeItems.map(({ id: _id, taxYearId: _ty, createdAt: _c, ...i }: any) => ({
        ...i,
        taxYearId: amended.id,
        notes:     `Copied from v${source.version ?? 1}`,
      })),
    });
  }

  // 6. Copy expense items
  if (source.expenseItems.length > 0) {
    await db.expenseItem.createMany({
      data: source.expenseItems.map(({ id: _id, taxYearId: _ty, createdAt: _c, ...e }: any) => ({
        ...e,
        taxYearId: amended.id,
        notes:     `Copied from v${source.version ?? 1}`,
      })),
    });
  }

  // 7. Copy scenario structure (results cleared automatically — no result relation)
  if (source.scenarios.length > 0) {
    await db.scenario.createMany({
      data: source.scenarios.map(({
        id: _id, taxYearId: _ty,
        createdAt: _c, updatedAt: _u,
        ...s
      }: any) => ({
        ...s,
        taxYearId: amended.id,
      })),
    });
  } else {
    await db.scenario.createMany({
      data: [
        { taxYearId: amended.id, type: "CONSERVATIVE", name: "Conservative" },
        { taxYearId: amended.id, type: "BALANCED",     name: "Balanced"     },
        { taxYearId: amended.id, type: "AGGRESSIVE",   name: "Aggressive"   },
      ],
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/tax-year/${sourceId}`);

  return {
    data: {
      id:      amended.id,
      version: newVersion,
      year:    source.year,
    },
  };
}

// Get all versions of a given household+year
export async function getTaxYearVersions(householdId: string, year: number) {
  return db.taxYear.findMany({
    where:   { householdId, year },
    orderBy: { version: "asc" },
    select: {
      id:         true,
      version:    true,
      filingType: true,
      signed8879: true,
      createdAt:  true,
      notes:      true,
      parentId:   true,
      _count: {
        select: { incomeItems: true, expenseItems: true },
      },
    },
  });
}
