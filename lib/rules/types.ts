// lib/rules/types.ts
// RuleSet interface — NOT stored in DB.
// Injected at calculation time by TaxYear.year.
// Missing year = TypeScript compile error.

import type { FilingStatus } from "../schemas";

export interface TaxBracket {
  upTo: number | null; // null = no ceiling (top bracket)
  rate: number;
}

export interface RuleSet {
  year: 2023 | 2024 | 2025;

  // SE Tax
  seTaxRate: number;              // 0.1413 = 15.3% × 92.35%
  seTaxDeductibleFraction: number; // 0.5

  // Income brackets per filing status
  taxBrackets: Record<FilingStatus, TaxBracket[]>;

  // Standard deduction per filing status
  standardDeduction: Record<FilingStatus, number>;

  // Child Tax Credit
  childTaxCredit: {
    perChild: number;
    phaseOutStart: Record<FilingStatus, number>;
    phaseOutPer2000: number; // reduce $50 per $2000 over threshold
    maxRefundable: number;   // ACTC — MVP: returns 0
  };

  // Self-employment
  se: {
    selfEmploymentIncomeFloor: number; // $400 minimum to owe SE tax
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

export function getRuleSet(year: number): RuleSet {
  if (year === 2025) return require("./2025").ruleSet2025;
  if (year === 2024) return require("./2024").ruleSet2024;
  if (year === 2023) return require("./2023").ruleSet2023;
  throw new Error(`No RuleSet found for year ${year}. Add /lib/rules/${year}/index.ts.`);
}
