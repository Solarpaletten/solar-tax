// lib/tax-engine/taxable-income.ts
// Pure function. No DB. No side effects.
//
// AGI = netProfit - deductibleSEhalf
// taxableIncome = max(0, AGI - standardDeduction)   ← floor guaranteed
// MVP: standard deduction only — no itemized

import { toCents, fromCents } from "@/lib/money";
import type { RuleSet } from "@/lib/rules/types";
import type { FilingStatus } from "@/lib/schemas";

export interface TaxableIncomeResult {
  agi: string;
  standardDeduction: string;
  taxableIncome: string;  // always >= "0.00"
}

export function TaxableIncomeEngine(
  netProfit: string,
  deductibleSEhalf: string,
  filingStatus: FilingStatus,
  ruleSet: RuleSet
): TaxableIncomeResult {
  const netProfitCents      = toCents(netProfit);
  const deductibleHalfCents = toCents(deductibleSEhalf);
  const stdDedCents         = toCents(ruleSet.standardDeduction[filingStatus]);

  const agiCents = netProfitCents - deductibleHalfCents;
  // Fix: taxable income cannot go negative — floor at 0
  const taxableIncomeCents = Math.max(0, agiCents - stdDedCents);

  const result = {
    agi:               fromCents(agiCents),
    standardDeduction: fromCents(stdDedCents),
    taxableIncome:     fromCents(taxableIncomeCents),
  };

  console.log("[TaxableIncomeEngine]", result);
  return result;
}
