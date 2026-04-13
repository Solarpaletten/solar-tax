// lib/tax-engine/profit.ts
// Pure function. No DB. No side effects.

import { subtractMoney } from "@/lib/money";

export interface ProfitResult {
  netProfit: string;  // gross - allowedExpenses
}

export function ProfitEngine(gross: string, allowedExpenses: string): ProfitResult {
  const netProfit = subtractMoney(gross, allowedExpenses);
  console.log("[ProfitEngine]", { gross, allowedExpenses, netProfit });
  return { netProfit };
}
