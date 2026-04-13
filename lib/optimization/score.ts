// lib/optimization/score.ts  v2
// Patch: scoreBreakdown now returned as object (not flat fields).
// Weights locked: tax 0.35 / audit 0.30 / profit 0.20 / credits 0.15
// Each sub-score is independently normalized 0–100.

import { toCents } from "@/lib/money";
import type { ScenarioSnapshot, OptimizationScore } from "./types";

const W = { taxEfficiency: 0.35, auditSafety: 0.30, profitQuality: 0.20, creditUtilization: 0.15 };

function taxEfficiencyScore(s: ScenarioSnapshot): number {
  const rate = parseFloat(s.effectiveRate);
  if (rate <= 0)  return 100;
  if (rate >= 40) return 0;
  return Math.round((1 - rate / 40) * 100);
}

function auditSafetyScore(s: ScenarioSnapshot): number {
  return Math.max(0, 100 - s.criticalFlags * 25 - s.warningFlags * 10 - s.infoFlags * 3);
}

function profitQualityScore(s: ScenarioSnapshot): number {
  const grossC  = toCents(s.grossIncome);
  const profitC = toCents(s.netProfit);
  if (grossC === 0)     return 50;
  if (profitC < 0)      return 20;
  const margin = profitC / grossC;
  if (margin < 0.05)    return 40;
  if (margin <= 0.50)   return Math.round(70 + margin * 60);
  if (margin <= 0.80)   return 100;
  return 70;
}

function creditUtilizationScore(s: ScenarioSnapshot): number {
  const c = toCents(s.totalCredits);
  const t = toCents(s.totalTax);
  if (c === 0) return 75;
  if (t === 0) return 60;
  if (c <= t)  return 100;
  return Math.round(60 + (t / c) * 40);
}

function label(total: number): OptimizationScore["label"] {
  if (total >= 80) return "Optimal";
  if (total >= 65) return "Good";
  if (total >= 50) return "Moderate";
  return "Risky";
}

export function computeScore(s: ScenarioSnapshot): OptimizationScore {
  const breakdown = {
    taxEfficiency:     taxEfficiencyScore(s),
    auditSafety:       auditSafetyScore(s),
    profitQuality:     profitQualityScore(s),
    creditUtilization: creditUtilizationScore(s),
  };

  const total = Math.round(
    breakdown.taxEfficiency     * W.taxEfficiency    +
    breakdown.auditSafety       * W.auditSafety      +
    breakdown.profitQuality     * W.profitQuality     +
    breakdown.creditUtilization * W.creditUtilization
  );

  console.log(`[ScoreEngine] ${s.type}`, breakdown, "→ total:", total);
  return { scenarioType: s.type, scoreBreakdown: breakdown, total, label: label(total) };
}

export function computeAllScores(scenarios: ScenarioSnapshot[]): OptimizationScore[] {
  return scenarios.map(computeScore);
}
