// actions/report.ts
"use server";

import { prisma, ensureSchema } from "@/lib/db/client";
import { buildIRS1040Report } from "@/lib/reporting/irs1040-map";
import { runOptimizationEngine } from "@/lib/optimization/engine";
import { runAllScenarios } from "./scenario";
import type { IRS1040Report } from "@/lib/reporting/types";

export async function generateIRSReport(taxYearId: string): Promise<IRS1040Report> {
  await ensureSchema();

  const taxYear = await prisma.taxYear.findUniqueOrThrow({
    where: { id: taxYearId },
    include: {
      household:   true,
      dependents:  true,
      incomeItems: true,
      expenseItems: true,
      scenarios:   { include: { result: true }, orderBy: { type: "asc" } },
      auditFlags:  true,
    },
  });

  // Ensure scenarios are calculated
  await runAllScenarios(taxYearId);

  // Re-fetch with results
  const taxYearFresh = await prisma.taxYear.findUniqueOrThrow({
    where: { id: taxYearId },
    include: {
      household:   true,
      dependents:  true,
      incomeItems: true,
      expenseItems: true,
      scenarios:   { include: { result: true }, orderBy: { type: "asc" } },
      auditFlags:  true,
    },
  });

  // Run optimization to find best scenario
  const snapshots = taxYearFresh.scenarios
    .filter(s => s.result)
    .map(s => ({
      type:            s.type as any,
      name:            s.name,
      grossIncome:     s.result!.grossIncome,
      allowedExpenses: s.result!.allowedExpenses,
      netProfit:       s.result!.netProfit,
      seTax:           s.result!.seTax,
      agi:             s.result!.agi,
      taxableIncome:   s.result!.taxableIncome,
      totalCredits:    s.result!.totalCredits,
      totalTax:        s.result!.taxOwed,
      refundAmount:    s.result!.refund,
      amountDue:       "0",
      effectiveRate:   s.result!.effectiveRate,
      criticalFlags:   0,
      warningFlags:    0,
      infoFlags:       0,
      expenseItems:    taxYearFresh.expenseItems.map(e => ({
        id: e.id, category: e.category, amount: e.amount, businessPct: e.businessPct,
      })),
      totalWithholding: s.result!.totalWithholding,
      grossSE:          s.result!.netProfit,
    }));

  const optimization = runOptimizationEngine(snapshots, taxYearFresh.auditFlags as any);
  const best = optimization.best;

  const bestScenario = taxYearFresh.scenarios.find(s => s.type === best.type);
  const bestResult   = bestScenario?.result;

  if (!bestResult) throw new Error("No scenario result found");

  return buildIRS1040Report({
    taxYear:        taxYearFresh,
    bestScenario:   best,
    scenarioResult: bestResult,
  });
}

export async function generateIRSReportPDF(taxYearId: string): Promise<Buffer> {
  const report = await generateIRSReport(taxYearId);
  const { generateReportPDF } = await import("@/lib/reporting/pdf");
  const bytes = await generateReportPDF(report);
  return Buffer.from(bytes);
}
