// lib/rules/2024/index.ts
import type { RuleSet } from "../types";

export const ruleSet2024: RuleSet = {
  year: 2024,
  seTaxRate: 0.1413,
  seTaxDeductibleFraction: 0.5,
  standardDeduction: {
    SINGLE: 14600,
    MARRIED_FILING_JOINTLY: 29200,
    MARRIED_FILING_SEPARATELY: 14600,
    HEAD_OF_HOUSEHOLD: 21900,
  },
  taxBrackets: {
    SINGLE: [
      { upTo: 11600,  rate: 0.10 },
      { upTo: 47150,  rate: 0.12 },
      { upTo: 100525, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243725, rate: 0.32 },
      { upTo: 609350, rate: 0.35 },
      { upTo: null,   rate: 0.37 },
    ],
    MARRIED_FILING_JOINTLY: [
      { upTo: 23200,  rate: 0.10 },
      { upTo: 94300,  rate: 0.12 },
      { upTo: 201050, rate: 0.22 },
      { upTo: 383900, rate: 0.24 },
      { upTo: 487450, rate: 0.32 },
      { upTo: 731200, rate: 0.35 },
      { upTo: null,   rate: 0.37 },
    ],
    MARRIED_FILING_SEPARATELY: [
      { upTo: 11600,  rate: 0.10 },
      { upTo: 47150,  rate: 0.12 },
      { upTo: 100525, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243725, rate: 0.32 },
      { upTo: 365600, rate: 0.35 },
      { upTo: null,   rate: 0.37 },
    ],
    HEAD_OF_HOUSEHOLD: [
      { upTo: 16550,  rate: 0.10 },
      { upTo: 63100,  rate: 0.12 },
      { upTo: 100500, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243700, rate: 0.32 },
      { upTo: 609350, rate: 0.35 },
      { upTo: null,   rate: 0.37 },
    ],
  },
  childTaxCredit: {
    perChild: 2000,
    phaseOutStart: {
      MARRIED_FILING_JOINTLY: 400000,
      SINGLE: 200000,
      MARRIED_FILING_SEPARATELY: 200000,
      HEAD_OF_HOUSEHOLD: 200000,
    },
    phaseOutPer2000: 50,
    maxRefundable: 1700,
  },
  se: { selfEmploymentIncomeFloor: 400 },
};
