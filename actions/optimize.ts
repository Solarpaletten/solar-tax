// actions/optimize.ts s
"use server";

import { prisma } from "@/lib/db/client";
import { runOptimizationEngine } from "@/lib/optimization/engine";
import { runAllScenarios } from "./scenario";
import type { ScenarioSnapshot } from "@/lib/optimization/types";

export async function getOptimization(taxYearId: string) {
  await runAllScenarios(taxYearId);

  const taxYear = await prisma.taxYear.findUniqueOrThrow({
    where: { id: taxYearId },
    include: {
      scenarios:    { include: { result: true }, orderBy: { type: "asc" } },
      expenseItems: true,
      auditFlags:   true,
    },
  });

  const TYPES = ["CONSERVATIVE", "BALANCED", "AGGRESSIVE"] as const;
  const snapshots: ScenarioSnapshot[] = [];

  for (const type of TYPES) {
    const scenario = taxYear.scenarios.find((s: any) => s.type === type);
    if (!scenario?.result) continue;

    const r = scenario.result;

    const savedOverrides: Record<string, number> = scenario.expenseOverrides
      ? JSON.parse(scenario.expenseOverrides)
      : {};

    const expenseItems = taxYear.expenseItems.map((e: any) => ({
      id:          e.id,
      category:    e.category,
      amount:      e.amount,          // already Float
      businessPct: savedOverrides[e.id] ?? e.businessPct,
    }));

    const flags         = taxYear.auditFlags;
    const criticalFlags = type === "BALANCED" ? flags.filter((f: any) => f.severity === "CRITICAL").length : 0;
    const warningFlags  = type === "BALANCED" ? flags.filter((f: any) => f.severity === "WARNING").length  : 0;
    const infoFlags     = type === "BALANCED" ? flags.filter((f: any) => f.severity === "INFO").length     : 0;

    // r.refund is now Float — no parseFloat needed
    const refundNum = r.refund as number;

    const snap: ScenarioSnapshot = {
      type,
      name:             scenario.name,
      grossIncome:      r.grossIncome,
      allowedExpenses:  r.allowedExpenses,
      netProfit:        r.netProfit,
      seTax:            r.seTax,
      agi:              r.agi,
      taxableIncome:    r.taxableIncome,
      totalCredits:     r.totalCredits,
      totalTax:         r.taxOwed,
      refundAmount:     refundNum >= 0 ? refundNum : 0,
      amountDue:        refundNum <  0 ? Math.abs(refundNum) : 0,
      effectiveRate:    r.effectiveRate,
      criticalFlags,
      warningFlags,
      infoFlags,
      expenseItems,
      totalWithholding: r.totalWithholding,
      grossSE:          r.grossIncome,
    };

    snapshots.push(snap);
  }

  if (snapshots.length === 0) {
    return { error: "No scenario results found. Run scenarios first." };
  }

  const result = runOptimizationEngine(snapshots);
  return { data: result };
}
