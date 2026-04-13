// lib/tax-engine/se-tax.ts
// Pure function. No DB. No side effects.
//
// Self-Employment Tax:
//   Net earnings for SE = netProfit × 92.35%  (Schedule SE line 4a)
//   SE Tax = net earnings × 15.3%
//   Simplified: seTax = netProfit × 0.1413  (= 0.9235 × 0.153)
//   Deductible half = seTax × 0.5  (Schedule 1, line 15)
//
// Only applies if netProfit >= floor ($400 for 2023-2025)

import { toCents, fromCents } from "@/lib/money";
import type { RuleSet } from "@/lib/rules/types";

export interface SEtaxResult {
  netEarningsForSE: string;  // netProfit × 92.35%
  seTax: string;             // × 15.3%
  deductibleHalf: string;    // seTax × 50% (above-the-line deduction)
  applies: boolean;          // false if below floor
}

export function SEtaxEngine(netProfit: string, ruleSet: RuleSet): SEtaxResult {
  const netProfitCents = toCents(netProfit);
  const floorCents = toCents(ruleSet.se.selfEmploymentIncomeFloor);

  if (netProfitCents < floorCents) {
    console.log("[SEtaxEngine] Below floor — no SE tax");
    return {
      netEarningsForSE: "0.00",
      seTax: "0.00",
      deductibleHalf: "0.00",
      applies: false,
    };
  }

  // Net earnings = netProfit × 92.35%
  const netEarningsCents = Math.round(netProfitCents * 0.9235);
  // SE Tax = net earnings × 15.3%
  const seTaxCents = Math.round(netEarningsCents * 0.153);
  // Deductible half
  const deductibleHalfCents = Math.round(seTaxCents * ruleSet.seTaxDeductibleFraction);

  const result = {
    netEarningsForSE: fromCents(netEarningsCents),
    seTax: fromCents(seTaxCents),
    deductibleHalf: fromCents(deductibleHalfCents),
    applies: true,
  };

  console.log("[SEtaxEngine]", result);
  return result;
}
