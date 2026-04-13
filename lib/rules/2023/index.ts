// lib/rules/2023/index.ts
import type { RuleSet } from "../types";

export const ruleSet2023: RuleSet = {
  year: 2023,
  seTaxRate: 0.1413,
  seTaxDeductibleFraction: 0.5,
  standardDeduction: {
    SINGLE: 13850,
    MARRIED_FILING_JOINTLY: 27700,
    MARRIED_FILING_SEPARATELY: 13850,
    HEAD_OF_HOUSEHOLD: 20800,
  },
  taxBrackets: {
    SINGLE: [
      { upTo: 11000,  rate: 0.10 },
      { upTo: 44725,  rate: 0.12 },
      { upTo: 95375,  rate: 0.22 },
      { upTo: 182050, rate: 0.24 },
      { upTo: 231250, rate: 0.32 },
      { upTo: 578125, rate: 0.35 },
      { upTo: null,   rate: 0.37 },
    ],
    MARRIED_FILING_JOINTLY: [
      { upTo: 22000,  rate: 0.10 },
      { upTo: 89450,  rate: 0.12 },
      { upTo: 190750, rate: 0.22 },
      { upTo: 364200, rate: 0.24 },
      { upTo: 462500, rate: 0.32 },
      { upTo: 693750, rate: 0.35 },
      { upTo: null,   rate: 0.37 },
    ],
    MARRIED_FILING_SEPARATELY: [
      { upTo: 11000,  rate: 0.10 },
      { upTo: 44725,  rate: 0.12 },
      { upTo: 95375,  rate: 0.22 },
      { upTo: 182050, rate: 0.24 },
      { upTo: 231250, rate: 0.32 },
      { upTo: 346875, rate: 0.35 },
      { upTo: null,   rate: 0.37 },
    ],
    HEAD_OF_HOUSEHOLD: [
      { upTo: 15700,  rate: 0.10 },
      { upTo: 59850,  rate: 0.12 },
      { upTo: 95350,  rate: 0.22 },
      { upTo: 182050, rate: 0.24 },
      { upTo: 231250, rate: 0.32 },
      { upTo: 578100, rate: 0.35 },
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
    maxRefundable: 1600,
  },
  se: { selfEmploymentIncomeFloor: 400 },
};
