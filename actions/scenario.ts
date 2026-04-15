// actions/scenario.ts s
"use server";

import { prisma } from "@/lib/db/client";
import { getRuleSet } from "@/lib/rules/types";
import { runScenarioPipeline } from "@/lib/tax-engine/scenario";
import type { FilingStatus } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export async function runScenario(
  scenarioId: string,
  expenseOverrides?: Record<string, number>
) {
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

  const savedOverrides: Record<string, number> =
    scenario.expenseOverrides ? JSON.parse(scenario.expenseOverrides) : {};
  const mergedOverrides = { ...savedOverrides, ...(expenseOverrides ?? {}) };

  if (expenseOverrides && Object.keys(expenseOverrides).length > 0) {
    await prisma.scenario.update({
      where: { id: scenarioId },
      data: { expenseOverrides: JSON.stringify(mergedOverrides) },
    });
  }

  const ruleSet = getRuleSet(taxYear.year);

  // DB Float → engine String (engine uses cent-math internally)
  const result = runScenarioPipeline(
    {
      incomeItems: taxYear.incomeItems.map((i) => ({
        type:        i.type,
        amount:      String(i.amount),
        withholding: String(i.withholding),
      })),
      expenseItems: taxYear.expenseItems.map((e) => ({
        id:          e.id,
        category:    e.category,
        amount:      String(e.amount),
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

  // engine String → DB Float
  const f = (s: string) => parseFloat(s) || 0;

  await prisma.scenarioResult.upsert({
    where: { scenarioId },
    create: {
      scenarioId,
      grossIncome:       f(result.grossIncome),
      totalExpenses:     f(result.totalExpenses),
      allowedExpenses:   f(result.allowedExpenses),
      netProfit:         f(result.netProfit),
      seTax:             f(result.seTax),
      deductibleSEhalf:  f(result.deductibleSEhalf),
      agi:               f(result.agi),
      standardDeduction: f(result.standardDeduction),
      taxableIncome:     f(result.taxableIncome),
      childTaxCredit:    f(result.childTaxCreditAfterPhaseout),
      totalCredits:      f(result.totalCredits),
      taxOwed:           f(result.totalTax),
      amountDue:         f(result.amountDue),
      totalWithholding:  f(result.totalWithholding),
      refund:            f(result.refund),
      effectiveRate:     f(result.effectiveRate),
    },
    update: {
      grossIncome:       f(result.grossIncome),
      totalExpenses:     f(result.totalExpenses),
      allowedExpenses:   f(result.allowedExpenses),
      netProfit:         f(result.netProfit),
      seTax:             f(result.seTax),
      deductibleSEhalf:  f(result.deductibleSEhalf),
      agi:               f(result.agi),
      standardDeduction: f(result.standardDeduction),
      taxableIncome:     f(result.taxableIncome),
      childTaxCredit:    f(result.childTaxCreditAfterPhaseout),
      totalCredits:      f(result.totalCredits),
      taxOwed:           f(result.totalTax),
      amountDue:         f(result.amountDue),
      totalWithholding:  f(result.totalWithholding),
      refund:            f(result.refund),
      effectiveRate:     f(result.effectiveRate),
    },
  });

  revalidatePath(`/tax-year/${taxYear.id}/scenarios`);
  return { data: result, scenarioId };
}

export async function runAllScenarios(taxYearId: string) {
  const scenarios = await prisma.scenario.findMany({
    where:  { taxYearId },
    select: { id: true },
  });
  return Promise.all(scenarios.map((s) => runScenario(s.id)));
}

export async function resetScenarioOverrides(scenarioId: string) {
  await prisma.scenario.update({
    where: { id: scenarioId },
    data:  { expenseOverrides: null },
  });
  return runScenario(scenarioId);
}
