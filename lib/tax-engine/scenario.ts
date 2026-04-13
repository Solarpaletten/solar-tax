// lib/tax-engine/scenario.ts
// Orchestrator. Pure function. No DB. No side effects.
// All inputs are deep-cloned before processing — overrides never mutate source.

import { IncomeEngine,        type IncomeItem       } from "./income";
import { ExpenseEngine,       type ExpenseItem,
                               type ExpenseOverrides } from "./expense";
import { ProfitEngine                                } from "./profit";
import { SEtaxEngine                                 } from "./se-tax";
import { TaxableIncomeEngine                         } from "./taxable-income";
import { CreditEngine,        type DependentForCredit} from "./credits";
import { FinalTaxEngine                              } from "./final-tax";
import type { RuleSet        } from "@/lib/rules/types";
import type { FilingStatus   } from "@/lib/schemas";

export interface ScenarioInput {
  incomeItems:      IncomeItem[];
  expenseItems:     ExpenseItem[];
  dependents:       DependentForCredit[];
  filingStatus:     FilingStatus;
  taxYear:          number;
  expenseOverrides?: ExpenseOverrides; // { itemId: pct 0-100 }
}

export interface ScenarioResult {
  // Income
  grossIncome:             string;
  totalWithholding:        string;
  selfEmploymentGross:     string;
  // Expenses
  totalExpenses:           string;
  allowedExpenses:         string;
  disallowedExpenses:      string;
  effectiveExpensePct:     number;
  // Profit
  netProfit:               string;
  // SE Tax
  netEarningsForSE:        string;
  seTax:                   string;
  deductibleSEhalf:        string;
  // Taxable income
  agi:                     string;
  standardDeduction:       string;
  taxableIncome:           string;
  // Credits
  qualifyingChildren:               number;
  childTaxCreditBase:               string;
  childTaxCreditAfterPhaseout:      string;
  totalCredits:                     string;
  // Final — split into two clear fields
  incomeTax:               string;
  incomeTaxAfterCredits:   string;
  totalTax:                string;
  refundAmount:            string;  // >= 0: what IRS owes you
  amountDue:               string;  // >= 0: what you owe IRS
  refund:                  string;  // signed legacy alias
  effectiveRate:           string;
}

export function runScenarioPipeline(
  input: ScenarioInput,
  ruleSet: RuleSet
): ScenarioResult {
  console.log("[ScenarioEngine] START", {
    year:           ruleSet.year,
    filingStatus:   input.filingStatus,
    incomeCount:    input.incomeItems.length,
    expenseCount:   input.expenseItems.length,
    dependentCount: input.dependents.length,
    overrides:      input.expenseOverrides,
  });

  // Fix: deep-clone inputs — overrides must never mutate DB-sourced objects
  const incomeItems  = input.incomeItems.map(i => ({ ...i }));
  const expenseItems = input.expenseItems.map(e => ({ ...e }));
  const dependents   = input.dependents.map(d => ({ ...d }));

  // 1. Income
  const incomeResult = IncomeEngine(incomeItems);

  // 2. Expenses (overrides applied inside, no mutation to expenseItems)
  const expenseResult = ExpenseEngine(expenseItems, input.expenseOverrides ?? {});

  // 3. Profit
  const profitResult = ProfitEngine(incomeResult.gross, expenseResult.totalAllowed);

  // 4. SE Tax
  const seResult = SEtaxEngine(profitResult.netProfit, ruleSet);

  // 5. Taxable income (floored at 0 inside engine)
  const tiResult = TaxableIncomeEngine(
    profitResult.netProfit,
    seResult.deductibleHalf,
    input.filingStatus,
    ruleSet
  );

  // 6. Credits
  const creditResult = CreditEngine(
    dependents,
    tiResult.agi,
    input.filingStatus,
    input.taxYear,
    ruleSet
  );

  // 7. Final tax
  const finalResult = FinalTaxEngine(
    tiResult.taxableIncome,
    creditResult.totalCredits,
    seResult.seTax,
    incomeResult.totalWithholding,
    input.filingStatus,
    ruleSet
  );

  const result: ScenarioResult = {
    grossIncome:                     incomeResult.gross,
    totalWithholding:                incomeResult.totalWithholding,
    selfEmploymentGross:             incomeResult.selfEmploymentGross,
    totalExpenses:                   expenseResult.totalEntered,
    allowedExpenses:                 expenseResult.totalAllowed,
    disallowedExpenses:              expenseResult.totalDisallowed,
    effectiveExpensePct:             expenseResult.effectivePct,
    netProfit:                       profitResult.netProfit,
    netEarningsForSE:                seResult.netEarningsForSE,
    seTax:                           seResult.seTax,
    deductibleSEhalf:                seResult.deductibleHalf,
    agi:                             tiResult.agi,
    standardDeduction:               tiResult.standardDeduction,
    taxableIncome:                   tiResult.taxableIncome,
    qualifyingChildren:              creditResult.qualifyingChildren,
    childTaxCreditBase:              creditResult.childTaxCreditBase,
    childTaxCreditAfterPhaseout:     creditResult.childTaxCreditAfterPhaseout,
    totalCredits:                    creditResult.totalCredits,
    incomeTax:                       finalResult.incomeTax,
    incomeTaxAfterCredits:           finalResult.incomeTaxAfterCredits,
    totalTax:                        finalResult.totalTax,
    refundAmount:                    finalResult.refundAmount,
    amountDue:                       finalResult.amountDue,
    refund:                          finalResult.refund,
    effectiveRate:                   finalResult.effectiveRate,
  };

  console.log("[ScenarioEngine] RESULT", result);
  return result;
}
