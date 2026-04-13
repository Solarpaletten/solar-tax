// actions/optimize.ts
"use server";

import { prisma } from "@/lib/db/client";
import { runOptimizationEngine } from "@/lib/optimization/engine";
import { runAllScenarios } from "./scenario";
import type { ScenarioSnapshot } from "@/lib/optimization/types";

export async function getOptimization(taxYearId: string) {
  // 1. Ensure all scenarios are calculated (idempotent)
  await runAllScenarios(taxYearId);

  // 2. Fetch full tax year data
  const taxYear = await prisma.taxYear.findUniqueOrThrow({
    where: { id: taxYearId },
    include: {
      scenarios: {
        include:  { result: true },
        orderBy:  { type: "asc" },
      },
      expenseItems: true,
      auditFlags:   true,
    },
  });

  // 3. Build ScenarioSnapshot[] for each scenario that has results
  const TYPES = ["CONSERVATIVE", "BALANCED", "AGGRESSIVE"] as const;
  const snapshots: ScenarioSnapshot[] = [];

  for (const type of TYPES) {
    const scenario = taxYear.scenarios.find(s => s.type === type);
    if (!scenario?.result) continue;

    const r = scenario.result;

    // Get saved overrides for this scenario
    const savedOverrides: Record<string, number> = scenario.expenseOverrides
      ? JSON.parse(scenario.expenseOverrides)
      : {};

    // Build expense snapshots with effective businessPct
    const expenseItems = taxYear.expenseItems.map(e => ({
      id:          e.id,
      category:    e.category,
      amount:      e.amount,
      businessPct: savedOverrides[e.id] ?? e.businessPct,
    }));

    // Count audit flags per severity for this scenario
    // (flags are stored at the taxYear level, keyed to BALANCED — approximate for others)
    const flags = taxYear.auditFlags;
    const criticalFlags = type === "BALANCED" ? flags.filter(f => f.severity === "CRITICAL").length : 0;
    const warningFlags  = type === "BALANCED" ? flags.filter(f => f.severity === "WARNING").length  : 0;
    const infoFlags     = type === "BALANCED" ? flags.filter(f => f.severity === "INFO").length     : 0;

    const refundNum = parseFloat(r.refund);
    const snap: ScenarioSnapshot = {
      type:             type,
      name:             scenario.name,
      grossIncome:      r.grossIncome,
      allowedExpenses:  r.allowedExpenses,
      netProfit:        r.netProfit,
      seTax:            r.seTax,
      agi:              r.agi,
      taxableIncome:    r.taxableIncome,
      totalCredits:     r.totalCredits,
      totalTax:         r.taxOwed,
      refundAmount:     refundNum >= 0 ? r.refund : "0",
      amountDue:        refundNum <  0 ? String(Math.abs(refundNum)) : "0",
      effectiveRate:    r.effectiveRate,
      criticalFlags,
      warningFlags,
      infoFlags,
      expenseItems,
      totalWithholding: r.totalWithholding,
      grossSE:          r.grossIncome,  // approximation — SE portion
    };

    snapshots.push(snap);
  }

  if (snapshots.length === 0) {
    return { error: "No scenario results found. Run scenarios first." };
  }

  // 4. Run engine
  const result = runOptimizationEngine(snapshots);
  return { data: result };
}
