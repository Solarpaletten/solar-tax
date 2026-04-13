// lib/tax-engine/expense.ts
// Pure function. No DB. No side effects.

import { applyRatio, sumMoney, toCents, fromCents } from "@/lib/money";

export interface ExpenseItem {
  id: string;
  category: string;
  amount: string;       // stored as String
  businessPct: number;  // 0–100, base value from DB
}

export interface ExpenseOverrides {
  [itemId: string]: number; // override businessPct per item (0–100)
}

export interface ExpenseResult {
  totalEntered: string;   // raw sum before business %
  totalAllowed: string;   // after applying businessPct
  totalDisallowed: string;
  byCategory: Record<string, { entered: string; allowed: string }>;
  effectivePct: number;   // overall average business use %
}

export function ExpenseEngine(
  items: ExpenseItem[],
  overrides: ExpenseOverrides = {}
): ExpenseResult {
  const byCategory: Record<string, { enteredCents: number; allowedCents: number }> = {};

  let totalEnteredCents = 0;
  let totalAllowedCents = 0;

  for (const item of items) {
    const pct = (overrides[item.id] ?? item.businessPct) / 100;
    const enteredCents = toCents(item.amount);
    const allowedCents = Math.round(enteredCents * pct);

    totalEnteredCents += enteredCents;
    totalAllowedCents += allowedCents;

    if (!byCategory[item.category]) {
      byCategory[item.category] = { enteredCents: 0, allowedCents: 0 };
    }
    byCategory[item.category].enteredCents += enteredCents;
    byCategory[item.category].allowedCents += allowedCents;
  }

  const totalEntered = fromCents(totalEnteredCents);
  const totalAllowed = fromCents(totalAllowedCents);
  const totalDisallowed = fromCents(totalEnteredCents - totalAllowedCents);
  const effectivePct =
    totalEnteredCents > 0
      ? Math.round((totalAllowedCents / totalEnteredCents) * 100)
      : 0;

  const byCategoryFormatted: Record<string, { entered: string; allowed: string }> = {};
  for (const [cat, vals] of Object.entries(byCategory)) {
    byCategoryFormatted[cat] = {
      entered: fromCents(vals.enteredCents),
      allowed: fromCents(vals.allowedCents),
    };
  }

  console.log("[ExpenseEngine]", { totalEntered, totalAllowed, effectivePct });

  return {
    totalEntered,
    totalAllowed,
    totalDisallowed,
    byCategory: byCategoryFormatted,
    effectivePct,
  };
}
