// lib/tax-engine/final-tax.ts
// Pure function. No DB. No side effects.
//
// Tax = progressive bracket calculation (real brackets)
// Credits applied after tax (non-refundable MVP: cannot go below 0)
// Splits result into refundAmount vs amountDue for clear UX.

import { toCents, fromCents } from "@/lib/money";
import type { RuleSet } from "@/lib/rules/types";
import type { FilingStatus } from "@/lib/schemas";

export interface FinalTaxResult {
  incomeTax: string;              // before credits, from brackets
  incomeTaxAfterCredits: string;  // max(0, tax - credits)
  seTax: string;                  // passed through for display
  totalTax: string;               // incomeTaxAfterCredits + seTax
  totalWithholding: string;       // passed through
  // Clear split: exactly one of these is > 0, the other is "0.00"
  refundAmount: string;           // what IRS owes you  (>= 0)
  amountDue: string;              // what you owe IRS   (>= 0)
  // Legacy alias kept for backward compat in ScenarioResult model
  refund: string;                 // positive = refund, negative = owe (raw)
  effectiveRate: string;          // incomeTax / taxableIncome (%)
}

function calculateBracketTax(
  taxableIncomeCents: number,
  brackets: Array<{ upTo: number | null; rate: number }>
): number {
  if (taxableIncomeCents <= 0) return 0;
  let taxCents = 0;
  let previousLimitCents = 0;
  for (const bracket of brackets) {
    const limitCents =
      bracket.upTo !== null ? Math.round(bracket.upTo * 100) : Infinity;
    const taxableInThisBracket = Math.min(
      taxableIncomeCents - previousLimitCents,
      limitCents - previousLimitCents
    );
    if (taxableInThisBracket <= 0) break;
    taxCents += Math.round(taxableInThisBracket * bracket.rate);
    previousLimitCents = limitCents;
    if (previousLimitCents >= taxableIncomeCents) break;
  }
  return taxCents;
}

export function FinalTaxEngine(
  taxableIncome: string,
  totalCredits: string,
  seTax: string,
  totalWithholding: string,
  filingStatus: FilingStatus,
  ruleSet: RuleSet
): FinalTaxResult {
  const taxableIncomeCents = toCents(taxableIncome);
  const creditsCents       = toCents(totalCredits);
  const seTaxCents         = toCents(seTax);
  const withholdingCents   = toCents(totalWithholding);

  const brackets = ruleSet.taxBrackets[filingStatus];
  const incomeTaxCents = calculateBracketTax(taxableIncomeCents, brackets);

  // Non-refundable credits (MVP): cannot reduce income tax below 0
  const incomeTaxAfterCreditsCents = Math.max(0, incomeTaxCents - creditsCents);
  const totalTaxCents = incomeTaxAfterCreditsCents + seTaxCents;

  // Raw net: positive = refund, negative = owe
  const netCents = withholdingCents - totalTaxCents;

  const refundAmount = fromCents(Math.max(0, netCents));
  const amountDue    = fromCents(Math.max(0, -netCents));
  const refund       = fromCents(netCents); // legacy signed value

  const effectiveRatePct =
    taxableIncomeCents > 0
      ? (incomeTaxCents / taxableIncomeCents) * 100
      : 0;

  const result: FinalTaxResult = {
    incomeTax:            fromCents(incomeTaxCents),
    incomeTaxAfterCredits: fromCents(incomeTaxAfterCreditsCents),
    seTax:                fromCents(seTaxCents),
    totalTax:             fromCents(totalTaxCents),
    totalWithholding:     fromCents(withholdingCents),
    refundAmount,
    amountDue,
    refund,
    effectiveRate:        effectiveRatePct.toFixed(2),
  };

  console.log("[FinalTaxEngine]", result);
  return result;
}
