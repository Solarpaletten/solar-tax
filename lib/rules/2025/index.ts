// lib/rules/2025/index.ts
// IRS 2025 tax parameters
// Source: IRS Rev. Proc. 2024-40

import type { RuleSet } from "../types";

export const ruleSet2025: RuleSet = {
  year: 2025,

  seTaxRate: 0.1413,           // 15.3% × 92.35% (net earnings multiplier)
  seTaxDeductibleFraction: 0.5,

  standardDeduction: {
    SINGLE: 15000,
    MARRIED_FILING_JOINTLY: 30000,
    MARRIED_FILING_SEPARATELY: 15000,
    HEAD_OF_HOUSEHOLD: 22500,
  },

  taxBrackets: {
    SINGLE: [
      { upTo: 11925,   rate: 0.10 },
      { upTo: 48475,   rate: 0.12 },
      { upTo: 103350,  rate: 0.22 },
      { upTo: 197300,  rate: 0.24 },
      { upTo: 250525,  rate: 0.32 },
      { upTo: 626350,  rate: 0.35 },
      { upTo: null,    rate: 0.37 },
    ],
    MARRIED_FILING_JOINTLY: [
      { upTo: 23850,   rate: 0.10 },
      { upTo: 96950,   rate: 0.12 },
      { upTo: 206700,  rate: 0.22 },
      { upTo: 394600,  rate: 0.24 },
      { upTo: 501050,  rate: 0.32 },
      { upTo: 751600,  rate: 0.35 },
      { upTo: null,    rate: 0.37 },
    ],
    MARRIED_FILING_SEPARATELY: [
      { upTo: 11925,   rate: 0.10 },
      { upTo: 48475,   rate: 0.12 },
      { upTo: 103350,  rate: 0.22 },
      { upTo: 197300,  rate: 0.24 },
      { upTo: 250525,  rate: 0.32 },
      { upTo: 375800,  rate: 0.35 },
      { upTo: null,    rate: 0.37 },
    ],
    HEAD_OF_HOUSEHOLD: [
      { upTo: 17000,   rate: 0.10 },
      { upTo: 64850,   rate: 0.12 },
      { upTo: 103350,  rate: 0.22 },
      { upTo: 197300,  rate: 0.24 },
      { upTo: 250500,  rate: 0.32 },
      { upTo: 626350,  rate: 0.35 },
      { upTo: null,    rate: 0.37 },
    ],
  },

  childTaxCredit: {
    perChild: 2000,
    phaseOutStart: {
      MARRIED_FILING_JOINTLY:   400000,
      SINGLE:                   200000,
      MARRIED_FILING_SEPARATELY: 200000,
      HEAD_OF_HOUSEHOLD:        200000,
    },
    phaseOutPer2000: 50, // reduce by $50 per $2,000 over threshold
    maxRefundable: 1700, // ACTC — MVP: returns 0 (non-refundable only)
  },

  se: {
    selfEmploymentIncomeFloor: 400, // below this: no SE tax owed
  },
};
