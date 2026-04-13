// lib/tax-engine/income.ts
// Pure function. No DB. No side effects.

import { sumMoney, toNumber } from "@/lib/money";

export interface IncomeItem {
  type: string;
  amount: string;      // stored as String
  withholding: string; // stored as String
}

export interface IncomeResult {
  gross: string;                        // total gross income
  byType: Record<string, string>;       // breakdown by IncomeType
  totalWithholding: string;             // sum of all withholding
  selfEmploymentGross: string;          // 1099-NEC + 1099-K + 1099-MISC
}

const SE_TYPES = new Set(["FORM_1099_NEC", "FORM_1099_K", "FORM_1099_MISC"]);

export function IncomeEngine(items: IncomeItem[]): IncomeResult {
  const byType: Record<string, string[]> = {};

  for (const item of items) {
    if (!byType[item.type]) byType[item.type] = [];
    byType[item.type].push(item.amount);
  }

  const byTypeSummed: Record<string, string> = {};
  for (const [type, amounts] of Object.entries(byType)) {
    byTypeSummed[type] = sumMoney(amounts);
  }

  const gross = sumMoney(items.map((i) => i.amount));
  const totalWithholding = sumMoney(items.map((i) => i.withholding));

  const selfEmploymentGross = sumMoney(
    items.filter((i) => SE_TYPES.has(i.type)).map((i) => i.amount)
  );

  console.log("[IncomeEngine]", { gross, totalWithholding, selfEmploymentGross });

  return { gross, byType: byTypeSummed, totalWithholding, selfEmploymentGross };
}
