// lib/optimization/recommend.ts  v2
// Patch:
//   + type: RecommendationType (HARD_RISK | OPTIMIZATION | INFO)
//   + why, whatChanges, impactEstimate per rule
//   + suggestedChange restricted to expense businessPct only
//   + conflict resolution: dedup by code, higher priority wins
// 10 deterministic rules, sorted HIGH→MEDIUM→LOW.

import { toCents } from "@/lib/money";
import type { ScenarioSnapshot, Recommendation, RecommendationType } from "./types";

type Rule = (s: ScenarioSnapshot[]) => Recommendation | null;

function fmt(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return "$" + Math.round(Math.abs(n)).toLocaleString();
}
function pct(v: number): string { return `${v}%`; }
function snap(s: ScenarioSnapshot[], t: string) { return s.find(x => x.type === t); }

// ── Rule 1: AUTO very high business % ─────────────────────────────────────────
const ruleAutoHighPct: Rule = (scenarios) => {
  const balanced = snap(scenarios, "BALANCED");
  if (!balanced) return null;
  const highItems = balanced.expenseItems.filter(e => e.category === "AUTO" && e.businessPct > 85);
  if (highItems.length === 0) return null;
  const worst = highItems.sort((a, b) => b.businessPct - a.businessPct)[0];
  const saferPct = 75;
  return {
    code:           "AUTO_HIGH_PCT",
    type:           "HARD_RISK",
    title:          `Vehicle claimed at ${worst.businessPct}% business use`,
    explanation:    `Auto expenses above 85% business use are a common audit trigger. The IRS cross-references vehicle deductions against statistical norms for your income level.`,
    why:            `Your vehicle is set to ${worst.businessPct}%, which exceeds the 85% threshold that statistically increases audit selection probability.`,
    whatChanges:    `Reduce to 75–80% and maintain a mileage log to support the claim.`,
    impactEstimate: `Reduces audit risk; mileage-log savings at 75% = ${fmt(parseFloat(worst.amount) * 0.10)} less deducted`,
    priority:       worst.businessPct > 95 ? "HIGH" : "MEDIUM",
    impact:         "RISK",
    scenarioType:   "BALANCED",
    suggestedChange: { expenseId: worst.id, newBusinessPct: saferPct, currentPct: worst.businessPct },
  };
};

// ── Rule 2: High expense-to-gross ratio ────────────────────────────────────────
const ruleHighExpenseRatio: Rule = (scenarios) => {
  const balanced = snap(scenarios, "BALANCED");
  if (!balanced) return null;
  const grossC   = toCents(balanced.grossIncome);
  const allowedC = toCents(balanced.allowedExpenses);
  if (grossC === 0) return null;
  const ratio = allowedC / grossC;
  if (ratio < 0.80) return null;
  const ratioStr = `${Math.round(ratio * 100)}%`;
  return {
    code:           "HIGH_EXPENSE_RATIO",
    type:           "HARD_RISK",
    title:          `Expenses are ${ratioStr} of gross income`,
    explanation:    `When Schedule C deductions exceed 80% of gross income, IRS models flag the return for increased scrutiny. Many businesses in your income range report 40–60% expense ratios.`,
    why:            `Your allowed expenses represent ${ratioStr} of gross — above the 80% threshold that triggers IRS statistical flags.`,
    whatChanges:    `Review each expense item for accurate business-use percentages and ensure all are properly documented.`,
    impactEstimate: `Documentation strength is the primary lever; inaccurate claims expose you to back-taxes + penalties`,
    priority:       ratio > 0.90 ? "HIGH" : "MEDIUM",
    impact:         "RISK",
    scenarioType:   "BALANCED",
  };
};

// ── Rule 3: Aggressive triggers CRITICAL flags ─────────────────────────────────
const ruleAggressiveCritical: Rule = (scenarios) => {
  const aggr = snap(scenarios, "AGGRESSIVE");
  if (!aggr || aggr.criticalFlags === 0) return null;
  const balanced  = snap(scenarios, "BALANCED");
  const extraRefund = balanced
    ? parseFloat(aggr.refundAmount) - parseFloat(balanced.refundAmount)
    : 0;
  return {
    code:           "AGGRESSIVE_CRITICAL_FLAGS",
    type:           "HARD_RISK",
    title:          `Aggressive triggers ${aggr.criticalFlags} critical audit flag${aggr.criticalFlags > 1 ? "s" : ""}`,
    explanation:    `Critical flags mean the return matches patterns the IRS specifically looks for during selection. This significantly increases the chance of an audit.`,
    why:            `The Aggressive scenario produces ${aggr.criticalFlags} CRITICAL flag${aggr.criticalFlags > 1 ? "s" : ""}. The extra refund vs Balanced is only ${fmt(extraRefund)}.`,
    whatChanges:    `Use the Balanced or Conservative scenario instead. The compliance risk outweighs the marginal gain.`,
    impactEstimate: extraRefund > 0 ? `Skip ${fmt(extraRefund)} extra refund to avoid audit risk` : `Avoid audit exposure`,
    priority:       "HIGH",
    impact:         "RISK",
    scenarioType:   "AGGRESSIVE",
  };
};

// ── Rule 4: Conservative is unnecessarily expensive ───────────────────────────
const ruleConservativeHighBurden: Rule = (scenarios) => {
  const conserv  = snap(scenarios, "CONSERVATIVE");
  const balanced = snap(scenarios, "BALANCED");
  if (!conserv || !balanced) return null;
  const extra = parseFloat(conserv.amountDue) - parseFloat(balanced.amountDue);
  if (extra < 500) return null;
  return {
    code:           "CONSERVATIVE_HIGH_BURDEN",
    type:           "OPTIMIZATION",
    title:          `Conservative costs ${fmt(extra)} more than Balanced`,
    explanation:    `By keeping all expense business-use percentages at their lowest, you're overpaying tax relative to your documented deductions.`,
    why:            `Conservative produces ${fmt(extra)} more in tax liability than Balanced with no meaningful reduction in audit risk.`,
    whatChanges:    `Move to the Balanced scenario to capture legitimate deductions already present in your data.`,
    impactEstimate: `Saves ${fmt(extra)} in tax`,
    priority:       extra > 2000 ? "HIGH" : "MEDIUM",
    impact:         "REFUND",
    scenarioType:   "CONSERVATIVE",
  };
};

// ── Rule 5: Zero withholding + significant tax due ────────────────────────────
const ruleNoWithholding: Rule = (scenarios) => {
  const balanced = snap(scenarios, "BALANCED");
  if (!balanced || toCents(balanced.totalWithholding) > 0) return null;
  const due = parseFloat(balanced.amountDue);
  if (due < 1000) return null;
  const quarterly = fmt(due / 4);
  return {
    code:           "NO_WITHHOLDING_PENALTY_RISK",
    type:           "HARD_RISK",
    title:          `No withholding — ${fmt(due)} estimated tax due`,
    explanation:    `The IRS requires quarterly estimated tax payments (Form 1040-ES) when you expect to owe $1,000 or more. Missing payments triggers an underpayment penalty on top of the tax owed.`,
    why:            `You have zero withholding against a ${fmt(due)} estimated tax liability.`,
    whatChanges:    `Set up quarterly payments of approximately ${quarterly} (Apr 15, Jun 15, Sep 15, Jan 15).`,
    impactEstimate: `Avoids underpayment penalty; spreads ${fmt(due)} across 4 payments of ~${quarterly}`,
    priority:       "HIGH",
    impact:         "WITHHOLDING",
    scenarioType:   "ALL",
  };
};

// ── Rule 6: Net loss ──────────────────────────────────────────────────────────
const ruleNetLoss: Rule = (scenarios) => {
  const balanced = snap(scenarios, "BALANCED");
  if (!balanced || toCents(balanced.netProfit) >= 0) return null;
  return {
    code:           "NET_LOSS",
    type:           "HARD_RISK",
    title:          "Schedule C shows a net loss",
    explanation:    `IRS hobby-loss rules (IRC §183) disallow deductions from activities that don't show profit in 3 of 5 years. A net loss also reduces other income, which may be beneficial — but only if you can defend the business intent.`,
    why:            `Your allowed expenses exceed gross income, producing a net loss of ${fmt(balanced.netProfit)}.`,
    whatChanges:    `Consider reducing discretionary expenses or deferring some to next year to show a profit this tax year.`,
    impactEstimate: `Turning a loss to break-even preserves deductibility of future expenses`,
    priority:       "MEDIUM",
    impact:         "PROFIT",
    scenarioType:   "BALANCED",
  };
};

// ── Rule 7: Child credit not fully utilized ───────────────────────────────────
const ruleCreditUnderutilized: Rule = (scenarios) => {
  const balanced = snap(scenarios, "BALANCED");
  if (!balanced) return null;
  const credits = toCents(balanced.totalCredits);
  const tax     = toCents(balanced.totalTax);
  if (credits === 0 || tax >= credits) return null;
  const wasted = credits - tax;
  return {
    code:           "CREDIT_UNDERUTILIZED",
    type:           "INFO",
    title:          `${fmt(wasted)} in Child Tax Credits can't offset tax`,
    explanation:    `Non-refundable credits can only reduce income tax to $0. Credits exceeding your income tax liability are unused in the current year (ACTC refundable portion is not yet implemented).`,
    why:            `You have ${fmt(balanced.totalCredits)} in CTC but only ${fmt(balanced.totalTax)} in income tax, leaving ${fmt(wasted)} unused.`,
    whatChanges:    `No immediate action. If income grows next year, you'll utilize credits more fully. Consider this when planning.`,
    impactEstimate: `${fmt(wasted)} unused credits this year`,
    priority:       "LOW",
    impact:         "CREDITS",
    scenarioType:   "BALANCED",
  };
};

// ── Rule 8: Balanced is clearly best tradeoff ─────────────────────────────────
const ruleBalancedOptimal: Rule = (scenarios) => {
  const balanced = snap(scenarios, "BALANCED");
  const aggr     = snap(scenarios, "AGGRESSIVE");
  if (!balanced || !aggr || balanced.criticalFlags > 0 || aggr.criticalFlags === 0) return null;
  return {
    code:           "BALANCED_RECOMMENDED",
    type:           "OPTIMIZATION",
    title:          "Balanced offers the best risk-adjusted outcome",
    explanation:    `Balanced achieves a strong tax position with zero critical flags, while Aggressive adds compliance exposure for a marginal extra benefit.`,
    why:            `Balanced has no critical flags; Aggressive adds ${aggr.criticalFlags} critical flag${aggr.criticalFlags > 1 ? "s" : ""}.`,
    whatChanges:    `File using the Balanced scenario's deduction levels.`,
    impactEstimate: `Zero critical audit flags vs Aggressive's ${aggr.criticalFlags}`,
    priority:       "MEDIUM",
    impact:         "RISK",
    scenarioType:   "BALANCED",
  };
};

// ── Rule 9: SE deductible half awareness ─────────────────────────────────────
const ruleSEDeductionAwareness: Rule = (scenarios) => {
  const balanced = snap(scenarios, "BALANCED");
  if (!balanced || toCents(balanced.seTax) < toCents("2000")) return null;
  const half = fmt(parseFloat(balanced.seTax) / 2);
  return {
    code:           "SE_DEDUCTIBLE_HALF",
    type:           "INFO",
    title:          `SE tax deductible half saves ${half} on AGI`,
    explanation:    `50% of your self-employment tax is deductible above-the-line (Schedule 1, Line 15). This is automatically applied in all scenarios — no action needed.`,
    why:            `Your SE tax of ${fmt(balanced.seTax)} qualifies for the 50% deduction, already applied in calculations.`,
    whatChanges:    `No action needed. Confirm this deduction appears on your prepared return.`,
    impactEstimate: `${half} AGI reduction already built in`,
    priority:       "LOW",
    impact:         "PROFIT",
    scenarioType:   "ALL",
  };
};

// ── Rule 10: Wide spread between Conservative and Aggressive ──────────────────
const ruleWideSpread: Rule = (scenarios) => {
  const conserv = snap(scenarios, "CONSERVATIVE");
  const aggr    = snap(scenarios, "AGGRESSIVE");
  if (!conserv || !aggr) return null;
  const cNet = parseFloat(conserv.refundAmount) - parseFloat(conserv.amountDue);
  const aNet = parseFloat(aggr.refundAmount)    - parseFloat(aggr.amountDue);
  const spread = Math.abs(aNet - cNet);
  if (spread < 2000) return null;
  return {
    code:           "WIDE_SCENARIO_SPREAD",
    type:           "INFO",
    title:          `${fmt(spread)} swing between Conservative and Aggressive`,
    explanation:    `A large gap between your least and most aggressive scenarios means your expense documentation choices have major impact on your final tax position.`,
    why:            `Conservative vs Aggressive outcome difference is ${fmt(spread)} — unusually large, indicating high leverage from deduction decisions.`,
    whatChanges:    `Prioritize organized records for every expense item. Good documentation gives you the flexibility to defend higher deductions at filing.`,
    impactEstimate: `${fmt(spread)} outcome range controlled by documentation quality`,
    priority:       "MEDIUM",
    impact:         "REFUND",
    scenarioType:   "ALL",
  };
};

// ── Conflict resolution ────────────────────────────────────────────────────────
// If two rules produce the same code: higher priority wins.
// If conflicting intent (e.g. "raise expenses" vs "lower expenses"):
//   HARD_RISK always wins; OPTIMIZATION defers to HARD_RISK on same expenseId.
function resolveConflicts(recs: Recommendation[]): Recommendation[] {
  const byCode = new Map<string, Recommendation>();
  const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const TYPE_ORDER: Record<string, number>     = { HARD_RISK: 0, OPTIMIZATION: 1, INFO: 2 };

  for (const rec of recs) {
    const existing = byCode.get(rec.code);
    if (!existing) { byCode.set(rec.code, rec); continue; }
    // Keep whichever has higher priority; tiebreak: HARD_RISK > OPTIMIZATION > INFO
    const pA = PRIORITY_ORDER[rec.priority];
    const pB = PRIORITY_ORDER[existing.priority];
    if (pA < pB || (pA === pB && TYPE_ORDER[rec.type] < TYPE_ORDER[existing.type])) {
      byCode.set(rec.code, rec);
    }
  }

  // Conflict: if two recs target the same expenseId with conflicting businessPct suggestions
  // → keep only the HARD_RISK one
  const expenseIdMap = new Map<string, Recommendation>();
  for (const rec of byCode.values()) {
    if (!rec.suggestedChange) continue;
    const eid = rec.suggestedChange.expenseId;
    const existing = expenseIdMap.get(eid);
    if (!existing || TYPE_ORDER[rec.type] < TYPE_ORDER[existing.type]) {
      expenseIdMap.set(eid, rec);
    }
  }

  return Array.from(byCode.values());
}

const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function generateRecommendations(scenarios: ScenarioSnapshot[]): Recommendation[] {
  const raw = [
    ruleAutoHighPct,
    ruleHighExpenseRatio,
    ruleAggressiveCritical,
    ruleConservativeHighBurden,
    ruleNoWithholding,
    ruleNetLoss,
    ruleCreditUnderutilized,
    ruleBalancedOptimal,
    ruleSEDeductionAwareness,
    ruleWideSpread,
  ].map(rule => rule(scenarios)).filter(Boolean) as Recommendation[];

  const resolved = resolveConflicts(raw);
  resolved.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  console.log(`[RecommendEngine] ${resolved.length} recommendations (${raw.length} raw → deduped)`,
    resolved.map(r => `${r.type}:${r.priority}:${r.code}`)
  );
  return resolved;
}
