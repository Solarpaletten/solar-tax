// app/tax-year/[id]/optimize/page.tsx  v3
// Task 5: ValueHighlight (WOW moment) + ActionTimeline + RichEmptyState

import { getOptimization     } from "@/actions/optimize";
import { getTaxYearFull      } from "@/actions/tax-year";
import { notFound            } from "next/navigation";
import { WorkspaceTabs       } from "@/components/workspace/WorkspaceTabs";
import { ActionChecklist     } from "@/components/optimize/ActionChecklist";
import { ApplySuggestion     } from "@/components/optimize/ApplySuggestion";
import { ValueHighlight      } from "@/components/onboarding/ValueHighlight";
import { ActionTimeline      } from "@/components/onboarding/ActionTimeline";
import { RichEmptyState      } from "@/components/onboarding/RichEmptyState";
import { AIAssistant         } from "@/components/ai/Assistant";
import { formatMoney         } from "@/lib/money";
import Link from "next/link";
import { clsx } from "clsx";
import type { OptimizationResult, OptimizationScore, Recommendation } from "@/lib/optimization/types";

export const dynamic = "force-dynamic";

const SCENARIO_STYLE: Record<string, string> = {
  CONSERVATIVE: "text-blue-400   border-blue-800   bg-blue-950/30",
  BALANCED:     "text-indigo-400 border-indigo-700  bg-indigo-950/30",
  AGGRESSIVE:   "text-purple-400 border-purple-700  bg-purple-950/30",
};
const PRIORITY_BADGE: Record<string, string> = {
  HIGH:   "bg-red-900    text-red-300",
  MEDIUM: "bg-amber-900  text-amber-300",
  LOW:    "bg-gray-800   text-gray-400",
};
const TYPE_BADGE: Record<string, string> = {
  HARD_RISK:    "bg-red-950    text-red-400   border border-red-800",
  OPTIMIZATION: "bg-indigo-950 text-indigo-400 border border-indigo-800",
  INFO:         "bg-gray-800   text-gray-400  border border-gray-700",
};
const TYPE_ICON: Record<string, string> = { HARD_RISK: "⚠", OPTIMIZATION: "↑", INFO: "ℹ" };
const IMPACT_ICON: Record<string, string> = {
  REFUND: "↑$", RISK: "🛡", PROFIT: "📈", CREDITS: "✦", WITHHOLDING: "📅",
};

function ScoreBar({ value, color = "bg-indigo-600" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
      <div className={clsx("h-full rounded-full", color)} style={{ width: `${value}%` }} />
    </div>
  );
}

function ScoreCard({ score }: { score: OptimizationScore }) {
  const styles     = SCENARIO_STYLE[score.scenarioType] ?? "";
  const [textClass,...borderBg] = styles.split(/\s{2,}/);
  const labelColor =
    score.label === "Optimal"  ? "text-green-400"  :
    score.label === "Good"     ? "text-indigo-400" :
    score.label === "Moderate" ? "text-amber-400"  : "text-red-400";
  const bd = score.scoreBreakdown;
  return (
    <div className={clsx("card border-2", ...borderBg)}>
      <div className="flex items-center justify-between mb-3">
        <span className={clsx("text-sm font-semibold", textClass)}>
          {score.scenarioType.charAt(0) + score.scenarioType.slice(1).toLowerCase()}
        </span>
        <div className="text-right">
          <span className="text-2xl font-bold text-gray-100 tabular-nums">{score.total}</span>
          <span className={clsx("text-xs font-medium ml-2", labelColor)}>{score.label}</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {[
          { label: "Tax efficiency", val: bd.taxEfficiency,     color: "bg-green-600",  wt: "35%" },
          { label: "Audit safety",   val: bd.auditSafety,       color: "bg-blue-600",   wt: "30%" },
          { label: "Profit quality", val: bd.profitQuality,     color: "bg-amber-600",  wt: "20%" },
          { label: "Credit usage",   val: bd.creditUtilization, color: "bg-purple-600", wt: "15%" },
        ].map(row => (
          <div key={row.label}>
            <div className="flex justify-between mb-0.5 items-center">
              <span className="text-xs text-gray-500">{row.label} <span className="text-gray-700">({row.wt})</span></span>
              <span className="text-xs text-gray-300 tabular-nums font-medium">{row.val}</span>
            </div>
            <ScoreBar value={row.val} color={row.color} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecCard({ rec, taxYearId, scenarioIds }: {
  rec: Recommendation; taxYearId: string; scenarioIds: string[];
}) {
  return (
    <div className="card border border-gray-800 hover:border-gray-700 transition-colors space-y-2.5">
      <div className="flex items-start gap-2 flex-wrap">
        <span className="text-lg flex-shrink-0 mt-0.5">{IMPACT_ICON[rec.impact] ?? "●"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1.5 mb-1">
            <span className={clsx("badge text-xs font-semibold", TYPE_BADGE[rec.type])}>
              {TYPE_ICON[rec.type]} {rec.type.replace("_", " ")}
            </span>
            <span className={clsx("badge text-xs font-medium", PRIORITY_BADGE[rec.priority])}>
              {rec.priority}
            </span>
            {rec.scenarioType !== "ALL" && (
              <span className="badge bg-gray-800 text-gray-500 text-xs border border-gray-700">
                {rec.scenarioType.charAt(0) + rec.scenarioType.slice(1).toLowerCase()}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-100">{rec.title}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{rec.explanation}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        {[
          { label: "Why triggered", text: rec.why,            textColor: "text-gray-300" },
          { label: "What to do",    text: rec.whatChanges,    textColor: "text-gray-300" },
          { label: "Expected impact", text: rec.impactEstimate, textColor: "text-indigo-400" },
        ].map(cell => (
          <div key={cell.label} className="rounded-lg bg-gray-800/60 px-3 py-2">
            <p className="text-xs font-semibold text-gray-500 mb-0.5">{cell.label}</p>
            <p className={clsx("text-xs font-medium", cell.textColor)}>{cell.text}</p>
          </div>
        ))}
      </div>
      {rec.suggestedChange && (
        <div className="pt-1">
          <ApplySuggestion
            taxYearId={taxYearId}
            scenarioIds={scenarioIds}
            expenseId={rec.suggestedChange.expenseId}
            newPct={rec.suggestedChange.newBusinessPct}
            currentPct={rec.suggestedChange.currentPct}
          />
        </div>
      )}
    </div>
  );
}

export default async function OptimizePage({ params }: { params: { id: string } }) {
  const [taxYear, optResult] = await Promise.all([
    getTaxYearFull(params.id),
    getOptimization(params.id),
  ]);
  if (!taxYear) notFound();

  const hasError = "error" in optResult;
  const opt: OptimizationResult | null = hasError ? null : optResult.data ?? null;
  const scenarioIds = taxYear.scenarios.map(s => s.id);

  // Compute ValueHighlight inputs from scenario results
  let highlightProps: Parameters<typeof ValueHighlight>[0] | null = null;
  if (opt) {
    const conservScore = opt.scores.find(s => s.scenarioType === "CONSERVATIVE");
    const bestScore    = opt.scores.find(s => s.scenarioType === opt.best.type);
    const conservSnap  = taxYear.scenarios.find(s => s.type === "CONSERVATIVE");
    const bestSnap     = taxYear.scenarios.find(s => s.type === opt.best.type);

    if (conservSnap?.result && bestSnap?.result) {
      const cNet = parseFloat(conservSnap.result.refund);   // signed
      const bNet = parseFloat(bestSnap.result.refund);
      highlightProps = {
        conservativeAmount:   cNet,
        bestAmount:           bNet,
        bestScenarioName:     opt.best.name,
        conservativeIsRefund: cNet >= 0,
        bestIsRefund:         bNet >= 0,
        effectiveRate:        bestSnap.result.effectiveRate,
        auditFlagsCount:      taxYear.auditFlags.length,
      };
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Link href="/dashboard" className="hover:text-gray-400">Dashboard</Link>
        <span>/</span>
        <Link href={`/tax-year/${taxYear.id}`} className="hover:text-gray-400">
          {taxYear.year} {taxYear.household.name}
        </Link>
        <span>/</span>
        <span className="text-gray-400">Optimize</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-100">Optimization Engine</h1>
        <p className="text-sm text-gray-500 mt-1">
          Not just what happened — what to change before December 31.
        </p>
      </div>

      <WorkspaceTabs taxYearId={taxYear.id} />

      {/* No data */}
      {(hasError || !opt) && <RichEmptyState context="no-optimization" taxYearId={taxYear.id} />}

      {opt && (
        <div className="space-y-10">

          {/* ── WOW MOMENT: Value Highlight ─────────────────────────────────── */}
          {highlightProps && <ValueHighlight {...highlightProps} />}

          {/* ── BLOCK 1: Best Scenario ───────────────────────────────────────── */}
          <section>
            <p className="section-title mb-3">Recommended scenario</p>
            <div className={clsx(
              "rounded-2xl border-2 px-6 py-5",
              SCENARIO_STYLE[opt.best.type]?.split(/\s{2,}/).slice(1).join(" ") ?? "border-gray-700 bg-gray-900"
            )}>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={clsx("text-2xl font-bold",
                      SCENARIO_STYLE[opt.best.type]?.split(/\s{2,}/)[0])}>
                      {opt.best.name}
                    </span>
                    <span className="badge bg-green-900 text-green-300 font-semibold">Score {opt.best.score}</span>
                    {opt.best.changedFrom && (
                      <span className="badge bg-amber-900 text-amber-300 text-xs">
                        Changed from {opt.best.changedFrom}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 max-w-xl">{opt.best.reason}</p>
                  <p className="text-xs text-gray-500 mt-1.5 max-w-xl italic">{opt.best.tradeoff}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {parseFloat(opt.best.refundAmount) > 0 ? (
                    <>
                      <p className="text-xs text-gray-500 mb-0.5">Estimated Refund</p>
                      <p className="text-3xl font-bold text-green-400 tabular-nums">+{formatMoney(opt.best.refundAmount)}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-0.5">Estimated Due</p>
                      <p className="text-3xl font-bold text-red-400 tabular-nums">{formatMoney(opt.best.amountDue)}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── BLOCK 2: Score Comparison ────────────────────────────────────── */}
          <section>
            <p className="section-title mb-3">Scenario scores</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {opt.scores.map(s => <ScoreCard key={s.scenarioType} score={s} />)}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Weights: Tax efficiency 35% · Audit safety 30% · Profit quality 20% · Credit usage 15%
            </p>
          </section>

          {/* ── BLOCK 3: Recommendations (grouped by type) ───────────────────── */}
          {opt.recommendations.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="section-title">Recommendations</p>
                <div className="flex gap-1.5">
                  {(["HARD_RISK", "OPTIMIZATION", "INFO"] as const).map(t => {
                    const count = opt.recommendations.filter(r => r.type === t).length;
                    if (!count) return null;
                    return (
                      <span key={t} className={clsx("badge text-xs", TYPE_BADGE[t])}>
                        {TYPE_ICON[t]} {count} {t.replace("_", " ").toLowerCase()}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-4">
                {opt.recommendations.map(rec => (
                  <RecCard key={rec.code} rec={rec} taxYearId={taxYear.id} scenarioIds={scenarioIds} />
                ))}
              </div>
            </section>
          )}

          {/* ── BLOCK 4: Action Timeline (replaces flat checklist) ───────────── */}
          <section>
            <p className="section-title mb-3">Action timeline</p>
            <ActionTimeline items={opt.actionItems} />
          </section>

          {/* ── BLOCK 5: Detailed Checklist (still available) ───────────────── */}
          <details className="group">
            <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-400 list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              Full checklist with details
            </summary>
            <div className="mt-3">
              <ActionChecklist items={opt.actionItems} />
            </div>
          </details>

          <div className="flex gap-3 pt-2">
            <Link href={`/tax-year/${taxYear.id}/flags`} className="btn-secondary">← Audit Risk</Link>
            <Link href={`/api/pdf/${taxYear.id}`} target="_blank" className="btn-secondary">↓ Export PDF</Link>
          </div>
        </div>
      )}

      <AIAssistant />
    </div>
  );
}
