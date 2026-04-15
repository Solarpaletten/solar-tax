// actions/report.ts s
"use server";

import { prisma, ensureSchema } from "@/lib/db/client";
import { buildIRS1040Report } from "@/lib/reporting/irs1040-map";
import { runOptimizationEngine } from "@/lib/optimization/engine";
import { runAllScenarios } from "./scenario";
import type { IRS1040Report } from "@/lib/reporting/types";

export async function generateIRSReport(taxYearId: string, overrides?: Record<string, number>): Promise<IRS1040Report> {
  await ensureSchema();

  await runAllScenarios(taxYearId);

  const taxYearFresh = await prisma.taxYear.findUniqueOrThrow({
    where: { id: taxYearId },
    include: {
      household:    true,
      dependents:   true,
      incomeItems:  true,
      expenseItems: true,
      scenarios:    { include: { result: true }, orderBy: { type: "asc" } },
      auditFlags:   true,
    },
  });

  const snapshots = taxYearFresh.scenarios
    .filter((s: any) => s.result)
    .map((s: any) => ({
      type:            s.type,
      name:            s.name,
      grossIncome:     s.result!.grossIncome,
      allowedExpenses: s.result!.allowedExpenses,
      netProfit:       s.result!.netProfit,
      seTax:           s.result!.seTax,
      agi:             s.result!.agi,
      taxableIncome:   s.result!.taxableIncome,
      totalCredits:    s.result!.totalCredits,
      totalTax:        s.result!.taxOwed,
      // Float — no parseFloat needed
      refundAmount:    s.result!.refund   >= 0 ? s.result!.refund   : 0,
      amountDue:       s.result!.amountDue > 0  ? s.result!.amountDue : 0,
      effectiveRate:   s.result!.effectiveRate,
      criticalFlags:   0,
      warningFlags:    0,
      infoFlags:       0,
      expenseItems:    taxYearFresh.expenseItems.map((e: any) => ({
        id: e.id, category: e.category, amount: e.amount, businessPct: e.businessPct,
      })),
      totalWithholding: s.result!.totalWithholding,
      grossSE:          s.result!.netProfit,
    }));

  const optimization = runOptimizationEngine(snapshots);
  const best         = optimization.best;

  const bestScenario = taxYearFresh.scenarios.find((s: any) => s.type === best.type);
  const bestResult   = bestScenario?.result;

  if (!bestResult) throw new Error("No scenario result found");

  return buildIRS1040Report({
    taxYear:        taxYearFresh,
    bestScenario:   best,
    scenarioResult: bestResult,
    overrides,
  });
}

export async function generateIRSReportPDF(taxYearId: string): Promise<Buffer> {
  const report = await generateIRSReport(taxYearId);
  const { generateReportPDF } = await import("@/lib/reporting/pdf");
  const bytes = await generateReportPDF(report);
  return Buffer.from(bytes);
}
