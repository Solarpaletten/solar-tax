// actions/scenario.ts
"use server";

import { prisma } from "@/lib/db/client";
import { getRuleSet } from "@/lib/rules/types";
import { runScenarioPipeline } from "@/lib/tax-engine/scenario";
import type { FilingStatus } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

/**
 * Run (or re-run) a single scenario and persist the result.
 * Called from the UI on every slider change (debounced 300ms).
 */
export async function runScenario(
  scenarioId: string,
  expenseOverrides?: Record<string, number>
) {
  // 1. Fetch full scenario + parent tax year data
  const scenario = await prisma.scenario.findUniqueOrThrow({
    where: { id: scenarioId },
    include: {
      taxYear: {
        include: {
          incomeItems:  true,
          expenseItems: true,
          dependents:   true,
        },
      },
    },
  });

  const { taxYear } = scenario;

  // Merge saved overrides with any incoming overrides (incoming wins)
  const savedOverrides: Record<string, number> =
    scenario.expenseOverrides ? JSON.parse(scenario.expenseOverrides) : {};
  const mergedOverrides = { ...savedOverrides, ...(expenseOverrides ?? {}) };

  // Persist merged overrides back to scenario
  if (expenseOverrides && Object.keys(expenseOverrides).length > 0) {
    await prisma.scenario.update({
      where: { id: scenarioId },
      data: { expenseOverrides: JSON.stringify(mergedOverrides) },
    });
  }

  // 2. Get rule set for this tax year
  const ruleSet = getRuleSet(taxYear.year);

  // 3. Run pipeline (pure function — no DB calls inside)
  const result = runScenarioPipeline(
    {
      incomeItems: taxYear.incomeItems.map((i) => ({
        type:        i.type,
        amount:      i.amount,
        withholding: i.withholding,
      })),
      expenseItems: taxYear.expenseItems.map((e) => ({
        id:          e.id,
        category:    e.category,
        amount:      e.amount,
        businessPct: e.businessPct,
      })),
      dependents: taxYear.dependents.map((d) => ({
        dateOfBirth: d.dateOfBirth,
        months:      d.months,
      })),
      filingStatus:     taxYear.filingStatus as FilingStatus,
      taxYear:          taxYear.year,
      expenseOverrides: mergedOverrides,
    },
    ruleSet
  );

  // 4. Persist ScenarioResult (upsert)
  await prisma.scenarioResult.upsert({
    where: { scenarioId },
    create: {
      scenarioId,
      grossIncome:                  result.grossIncome,
      totalExpenses:                result.totalExpenses,
      allowedExpenses:              result.allowedExpenses,
      netProfit:                    result.netProfit,
      seTax:                        result.seTax,
      deductibleSEhalf:             result.deductibleSEhalf,
      agi:                          result.agi,
      standardDeduction:            result.standardDeduction,
      taxableIncome:                result.taxableIncome,
      childTaxCredit:               result.childTaxCreditAfterPhaseout,
      totalCredits:                 result.totalCredits,
      taxOwed:                      result.totalTax,
      totalWithholding:             result.totalWithholding,
      refund:                       result.refund,
      effectiveRate:                result.effectiveRate,
    },
    update: {
      grossIncome:                  result.grossIncome,
      totalExpenses:                result.totalExpenses,
      allowedExpenses:              result.allowedExpenses,
      netProfit:                    result.netProfit,
      seTax:                        result.seTax,
      deductibleSEhalf:             result.deductibleSEhalf,
      agi:                          result.agi,
      standardDeduction:            result.standardDeduction,
      taxableIncome:                result.taxableIncome,
      childTaxCredit:               result.childTaxCreditAfterPhaseout,
      totalCredits:                 result.totalCredits,
      taxOwed:                      result.totalTax,
      totalWithholding:             result.totalWithholding,
      refund:                       result.refund,
      effectiveRate:                result.effectiveRate,
    },
  });

  revalidatePath(`/tax-year/${taxYear.id}/scenarios`);
  return { data: result, scenarioId };
}

/**
 * Run all 3 scenarios for a tax year at once.
 * Called when entering the scenarios tab.
 */
export async function runAllScenarios(taxYearId: string) {
  const scenarios = await prisma.scenario.findMany({
    where: { taxYearId },
    select: { id: true },
  });

  const results = await Promise.all(
    scenarios.map((s) => runScenario(s.id))
  );

  return results;
}

/**
 * Reset scenario overrides to base (no overrides).
 */
export async function resetScenarioOverrides(scenarioId: string) {
  await prisma.scenario.update({
    where: { id: scenarioId },
    data: { expenseOverrides: null },
  });
  return runScenario(scenarioId);
}
