// lib/optimization/compare.ts  v2
// Patch: hysteresis — don't switch best scenario if score difference < 5 pts.
// CRITICAL flag penalty applied to selection score only (not displayed score).

import type { ScenarioSnapshot, OptimizationScore, BestScenario } from "./types";

const HYSTERESIS_THRESHOLD = 5;
// In-memory previous best for this server process (resets on deploy — acceptable for MVP)
let _previousBest: { type: string; score: number } | null = null;

export function selectBestScenario(
  scenarios: ScenarioSnapshot[],
  scores:    OptimizationScore[]
): BestScenario {
  const scoreMap = new Map(scores.map(s => [s.scenarioType, s.total]));
  const ORDER    = ["BALANCED", "CONSERVATIVE", "AGGRESSIVE"];

  // Selection score = displayed score − CRITICAL penalty
  const candidates = scenarios.map(s => ({
    type:       s.type,
    name:       s.name,
    snap:       s,
    displayed:  scoreMap.get(s.type) ?? 0,
    selection:  (scoreMap.get(s.type) ?? 0) - s.criticalFlags * 20,
  }));

  candidates.sort((a, b) => {
    if (b.selection !== a.selection) return b.selection - a.selection;
    return ORDER.indexOf(a.type) - ORDER.indexOf(b.type);
  });

  const top = candidates[0];

  // Hysteresis: if there was a previous best and the new winner only beats it
  // by less than HYSTERESIS_THRESHOLD, keep the previous best.
  let winner = top;
  let changedFrom: string | undefined;

  if (_previousBest && _previousBest.type !== top.type) {
    const prevScore = candidates.find(c => c.type === _previousBest!.type)?.selection ?? 0;
    const gap       = top.selection - prevScore;
    if (gap < HYSTERESIS_THRESHOLD) {
      // Stick with the previous best
      const prev = candidates.find(c => c.type === _previousBest!.type);
      if (prev) winner = prev;
    } else {
      changedFrom = _previousBest.type as string;
    }
  }

  _previousBest = { type: winner.type, score: winner.selection };

  const { reason, tradeoff } = buildExplanation(winner, candidates, scoreMap);

  return {
    type:         winner.type,
    name:         winner.name,
    reason,
    tradeoff,
    refundAmount: winner.snap.refundAmount,
    amountDue:    winner.snap.amountDue,
    score:        winner.displayed,
    changedFrom:  changedFrom as any,
  };
}

function fmt(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return "$" + Math.round(Math.abs(n)).toLocaleString();
}

function buildExplanation(
  winner:     ReturnType<typeof Object.assign>,
  candidates: Array<{ type: string; snap: ScenarioSnapshot; displayed: number; selection: number }>,
  scoreMap:   Map<string, number>
): { reason: string; tradeoff: string } {
  const type      = winner.type as string;
  const snap      = winner.snap as ScenarioSnapshot;
  const aggr      = candidates.find(c => c.type === "AGGRESSIVE");
  const conserv   = candidates.find(c => c.type === "CONSERVATIVE");
  const refundNum = parseFloat(snap.refundAmount);
  const dueNum    = parseFloat(snap.amountDue);
  const hasRefund = refundNum > 0;

  if (type === "BALANCED") {
    if (aggr && aggr.snap.criticalFlags > 0) {
      return {
        reason:   `Balanced delivers strong results while avoiding ${aggr.snap.criticalFlags} critical audit flag${aggr.snap.criticalFlags > 1 ? "s" : ""} triggered by the Aggressive scenario.`,
        tradeoff: `Aggressive would save ${fmt(parseFloat(aggr.snap.refundAmount) - refundNum)} more, but the compliance risk outweighs the benefit at this stage.`,
      };
    }
    return {
      reason:   `Balanced provides the best risk-adjusted outcome: ${hasRefund ? `a ${fmt(refundNum)} refund` : `manageable ${fmt(dueNum)} due`} with the lowest combined audit exposure.`,
      tradeoff: `Conservative is cleaner but leaves potential deductions unclaimed. Aggressive maximizes deductions but raises audit flags.`,
    };
  }

  if (type === "CONSERVATIVE") {
    return {
      reason:   `Conservative is the safest choice — ${snap.criticalFlags === 0 && snap.warningFlags === 0 ? "zero audit flags" : "minimal audit risk"} and predictable tax outcomes.`,
      tradeoff: `You may be leaving legitimate deductions unclaimed. Consider documenting additional business expenses to justify a higher deduction claim.`,
    };
  }

  if (type === "AGGRESSIVE") {
    return {
      reason:   `Aggressive maximizes deductions and produces the ${hasRefund ? `highest refund (${fmt(refundNum)})` : "lowest tax due"} of all three scenarios.`,
      tradeoff: `Higher deduction levels require strong documentation. Ensure all business-use percentages are supportable with records before filing.`,
    };
  }

  return { reason: `Score: ${winner.displayed}`, tradeoff: "Review other scenarios for comparison." };
}
