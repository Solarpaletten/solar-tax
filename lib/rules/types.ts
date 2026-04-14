// lib/rules/types.ts

import type { FilingStatus } from "../schemas";

export interface TaxBracket {
  upTo: number | null;
  rate: number;
}

export interface RuleSet {
  year: number;
  seTaxRate: number;
  seTaxDeductibleFraction: number;
  taxBrackets: Record<FilingStatus, TaxBracket[]>;
  standardDeduction: Record<FilingStatus, number>;
  childTaxCredit: {
    perChild: number;
    phaseOutStart: Record<FilingStatus, number>;
    phaseOutPer2000: number;
    maxRefundable: number;
  };
  se: {
    selfEmploymentIncomeFloor: number;
  };
}

export function getRuleSet(year: number): RuleSet {
  if (year === 2025) return require("./2025").ruleSet2025;
  if (year === 2024) return require("./2024").ruleSet2024;
  if (year === 2023) return require("./2023").ruleSet2023;
  // For future years — use latest known rules with updated year
  if (year > 2025) return { ...require("./2025").ruleSet2025, year };
  // For past years before 2023 — use 2023
  return { ...require("./2023").ruleSet2023, year };
}
