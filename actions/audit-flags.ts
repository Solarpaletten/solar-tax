// actions/audit-flags.ts s
"use server";

import { prisma } from "@/lib/db/client";
import { detectAuditFlags } from "@/lib/tax-engine/audit-flags";
import { revalidatePath } from "next/cache";
import type { ScenarioResult } from "@/lib/tax-engine/scenario";

export async function refreshAuditFlags(taxYearId: string) {
  const taxYear = await prisma.taxYear.findUniqueOrThrow({
    where: { id: taxYearId },
    include: {
      expenseItems: true,
      scenarios: {
        where:   { type: "BALANCED" },
        include: { result: true },
        take:    1,
      },
    },
  });

  const balancedScenario = taxYear.scenarios[0];
  if (!balancedScenario?.result) return { data: [] };

  const r = balancedScenario.result;

  // r fields are now Float — bridge to engine String format
  const refundNum = r.refund as number;

  const engineResult: ScenarioResult = {
    grossIncome:                 r.grossIncome,
    totalWithholding:            r.totalWithholding,
    selfEmploymentGross:         r.grossIncome,
    totalExpenses:               r.totalExpenses,
    allowedExpenses:             r.allowedExpenses,
    disallowedExpenses:          "0",
    effectiveExpensePct:         0,
    netProfit:                   r.netProfit,
    netEarningsForSE:            "0",
    seTax:                       r.seTax,
    deductibleSEhalf:            r.deductibleSEhalf,
    agi:                         r.agi,
    standardDeduction:           r.standardDeduction,
    taxableIncome:               r.taxableIncome,
    qualifyingChildren:          0,
    childTaxCreditBase:          "0",
    childTaxCreditAfterPhaseout: r.childTaxCredit,
    totalCredits:                r.totalCredits,
    incomeTax:                   r.taxOwed,
    incomeTaxAfterCredits:       r.taxOwed,
    totalTax:                    r.taxOwed,
    refundAmount:                refundNum >= 0 ? refundNum : 0,
    amountDue:                   refundNum <  0 ? Math.abs(refundNum) : 0,
    refund:                      refundNum,
    effectiveRate:               r.effectiveRate,
  };

  const flags = detectAuditFlags(
    engineResult,
    taxYear.expenseItems.map((e: any) => ({
      category:    e.category,
      amount:      e.amount,
      businessPct: e.businessPct,
    }))
  );

  await prisma.auditFlag.deleteMany({ where: { taxYearId } });

  if (flags.length > 0) {
    await prisma.auditFlag.createMany({
      data: flags.map((f: any) => ({
        taxYearId,
        code:     f.code,
        severity: f.severity,
        message:  f.message,
        detail:   f.detail,
      })),
    });
  }

  revalidatePath(`/tax-year/${taxYearId}/flags`);
  return { data: flags };
}
