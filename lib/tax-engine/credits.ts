// lib/tax-engine/credits.ts
// Pure function. No DB. No side effects.
//
// Child Tax Credit (non-refundable, MVP):
//   creditBase = dependents × perChild ($2,000 for 2025)
//   phase-out: reduce $50 per $2,000 of AGI over threshold
//   creditCapped = min(creditBase after phase-out, taxOwed)
//
// ACTC (refundable portion): returns 0 in MVP — TODO Task 3

import { toCents, fromCents } from "@/lib/money";
import type { RuleSet } from "@/lib/rules/types";
import type { FilingStatus } from "@/lib/schemas";

export interface DependentForCredit {
  dateOfBirth: string;
  months: number;
}

export interface CreditResult {
  childTaxCreditBase: string;     // before phase-out
  childTaxCreditAfterPhaseout: string;
  qualifyingChildren: number;
  totalCredits: string;           // sum of all credits (v1 = CTC only)
}

/**
 * Calculate age from ISO date string (YYYY-MM-DD) at end of tax year.
 */
function ageAtYearEnd(dateOfBirth: string, taxYear: number): number {
  const dob = new Date(dateOfBirth);
  const yearEnd = new Date(taxYear, 11, 31); // Dec 31
  let age = yearEnd.getFullYear() - dob.getFullYear();
  const m = yearEnd.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && yearEnd.getDate() < dob.getDate())) age--;
  return age;
}

export function CreditEngine(
  dependents: DependentForCredit[],
  agi: string,
  filingStatus: FilingStatus,
  taxYear: number,
  ruleSet: RuleSet
): CreditResult {
  const ctc = ruleSet.childTaxCredit;

  // Qualifying children: under 17 at year end, lived in household ≥ 6 months
  const qualifyingChildren = dependents.filter((d) => {
    const age = ageAtYearEnd(d.dateOfBirth, taxYear);
    return age < 17 && d.months >= 6;
  }).length;

  const creditBaseCents = qualifyingChildren * toCents(String(ctc.perChild));

  // Phase-out: $50 reduction per $2,000 (or fraction) over threshold
  const agiCents = toCents(agi);
  const thresholdCents = toCents(String(ctc.phaseOutStart[filingStatus]));
  let creditAfterPhaseoutCents = creditBaseCents;

  if (agiCents > thresholdCents) {
    const excessCents = agiCents - thresholdCents;
    // How many $2,000 increments (round up)
    const increments = Math.ceil(excessCents / toCents("2000"));
    const reduction = increments * toCents(String(ctc.phaseOutPer2000));
    creditAfterPhaseoutCents = Math.max(0, creditBaseCents - reduction);
  }

  const result: CreditResult = {
    childTaxCreditBase: fromCents(creditBaseCents),
    childTaxCreditAfterPhaseout: fromCents(creditAfterPhaseoutCents),
    qualifyingChildren,
    totalCredits: fromCents(creditAfterPhaseoutCents), // v1: CTC only
  };

  console.log("[CreditEngine]", result);
  return result;
}
