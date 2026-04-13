// lib/tax-engine/audit-flags.ts
// Rule-based audit risk detection.
// Runs after ScenarioEngine on the BALANCED scenario result.
// Pure function — no DB calls.

import { toCents } from "@/lib/money";
import type { ScenarioResult } from "./scenario";

export interface AuditFlagOutput {
  code:     string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message:  string;
  detail:   string;
}

interface ExpenseSnapshot {
  category:    string;
  amount:      string;
  businessPct: number;
}

export function detectAuditFlags(
  result: ScenarioResult,
  expenses: ExpenseSnapshot[]
): AuditFlagOutput[] {
  const flags: AuditFlagOutput[] = [];

  const grossCents   = toCents(result.grossIncome);
  const allowedCents = toCents(result.allowedExpenses);
  const netCents     = toCents(result.netProfit);

  // 1. High expense ratio (>85% of gross)
  if (grossCents > 0) {
    const ratio = allowedCents / grossCents;
    if (ratio > 0.85) {
      flags.push({
        code:     "HIGH_EXPENSE_RATIO",
        severity: "WARNING",
        message:  `Expense deduction is ${Math.round(ratio * 100)}% of gross income`,
        detail:   "IRS statistical norms suggest deductions above 85% of gross income in Schedule C returns are more likely to be reviewed. Consider documentation for all claimed expenses.",
      });
    }
  }

  // 2. Auto at 100% business use AND over $5,000
  const autoExpenses = expenses.filter(e => e.category === "AUTO");
  for (const e of autoExpenses) {
    if (e.businessPct === 100 && toCents(e.amount) > toCents("5000")) {
      flags.push({
        code:     "AUTO_100PCT_HIGH_AMOUNT",
        severity: "WARNING",
        message:  `Vehicle claimed at 100% business use ($${parseFloat(e.amount).toLocaleString()})`,
        detail:   "Claiming 100% business use on a vehicle over $5,000 is a common audit trigger. IRS typically expects some personal use. If accurate, maintain a mileage log.",
      });
    }
  }

  // 3. Meals over 50% of total expenses
  const mealsCents = expenses
    .filter(e => e.category === "MEALS")
    .reduce((s, e) => s + Math.round(toCents(e.amount) * (e.businessPct / 100)), 0);
  const totalExpCents = toCents(result.totalExpenses);
  if (totalExpCents > 0 && mealsCents / totalExpCents > 0.5) {
    flags.push({
      code:     "MEALS_OVER_HALF_EXPENSES",
      severity: "INFO",
      message:  "Meals expenses exceed 50% of total deductions",
      detail:   "Meals are subject to the 50% deductibility limit under IRC §274. Ensure amounts entered are already at 50% — if not, the engine will over-deduct. Also check for documentation.",
    });
  }

  // 4. High income, zero withholding
  if (grossCents > toCents("50000") && toCents(result.totalWithholding) === 0) {
    flags.push({
      code:     "NO_WITHHOLDING_HIGH_INCOME",
      severity: "CRITICAL",
      message:  "No withholding recorded on income over $50,000",
      detail:   "Self-employed filers with gross income over $50,000 and no estimated quarterly payments (Form 1040-ES) may face an underpayment penalty. Consider adding estimated payments.",
    });
  }

  // 5. Net loss (negative net profit)
  if (netCents < 0) {
    flags.push({
      code:     "NET_LOSS",
      severity: "INFO",
      message:  "Schedule C shows a net loss",
      detail:   "A net loss in a self-employment activity may be subject to hobby loss rules (IRC §183) if the activity does not show profit in 3 of 5 years. Ensure activity is operated as a business.",
    });
  }

  // 6. Home office with high amount
  const homeOfficeCents = expenses
    .filter(e => e.category === "HOME_OFFICE")
    .reduce((s, e) => s + toCents(e.amount), 0);
  if (homeOfficeCents > toCents("10000")) {
    flags.push({
      code:     "HOME_OFFICE_HIGH_AMOUNT",
      severity: "INFO",
      message:  `Home office deduction is $${(homeOfficeCents / 100).toLocaleString()}`,
      detail:   "Home office deductions over $10,000 may draw scrutiny. Ensure the space is used regularly and exclusively for business (IRC §280A). Consider using the simplified method ($5/sq ft, max 300 sq ft).",
    });
  }

  console.log(`[AuditFlagEngine] ${flags.length} flag(s) detected`, flags.map(f => f.code));
  return flags;
}
