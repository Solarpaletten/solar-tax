// components/scenario/ScenarioPanel.tsx
"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { runScenario } from "@/actions/scenario";
import { formatMoney } from "@/lib/money";
import { clsx } from "clsx";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: string;
  businessPct: number;
}

interface ScenarioResult {
  grossIncome: string;
  totalExpenses: string;
  allowedExpenses: string;
  netProfit: string;
  seTax: string;
  deductibleSEhalf: string;
  agi: string;
  standardDeduction: string;
  taxableIncome: string;
  childTaxCreditAfterPhaseout: string;
  totalCredits: string;
  incomeTax: string;
  incomeTaxAfterCredits: string;
  totalTax: string;
  refund: string;
  effectiveRate: string;
}

interface Scenario {
  id: string;
  type: string;
  name: string;
  expenseOverrides: string | null;
  result: ScenarioResult | null;
}

const CAT_LABELS: Record<string, string> = {
  AUTO: "Auto", PHONE: "Phone", HOME_OFFICE: "Home Office",
  SUPPLIES: "Supplies", MEALS: "Meals", TRAVEL: "Travel",
  INSURANCE: "Insurance", SOFTWARE: "Software",
  MARKETING: "Marketing", PROFESSIONAL_FEES: "Professional",
  OTHER: "Other",
};

const TYPE_COLOR: Record<string, string> = {
  CONSERVATIVE: "border-blue-800",
  BALANCED:     "border-indigo-700",
  AGGRESSIVE:   "border-purple-700",
};
const TYPE_BADGE: Record<string, string> = {
  CONSERVATIVE: "bg-blue-900 text-blue-300",
  BALANCED:     "bg-indigo-900 text-indigo-300",
  AGGRESSIVE:   "bg-purple-900 text-purple-300",
};

// ── ResultRow ─────────────────────────────────────────────────────────────────
function ResultRow({
  label,
  value,
  sub,
  highlight = false,
  negative = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  const num = parseFloat(value);
  const colorClass = highlight
    ? num >= 0
      ? "text-green-400"
      : "text-red-400"
    : negative
    ? "text-red-300"
    : "text-gray-200";

  return (
    <div className={clsx("flex justify-between items-baseline py-1.5 border-b border-gray-800", highlight && "bg-gray-800/40 px-2 rounded")}>
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-right">
        <span className={clsx("text-sm font-semibold tabular-nums", colorClass)}>
          {formatMoney(value)}
        </span>
        {sub && <p className="text-xs text-gray-600">{sub}</p>}
      </div>
    </div>
  );
}

// ── DeltaBadge ────────────────────────────────────────────────────────────────
function DeltaBadge({ current, baseline }: { current: string; baseline: string | null }) {
  if (!baseline) return null;
  const delta = parseFloat(current) - parseFloat(baseline);
  if (Math.abs(delta) < 1) return null;
  const positive = delta > 0;
  return (
    <span className={clsx(
      "ml-2 text-xs font-medium tabular-nums",
      positive ? "text-green-500" : "text-red-500"
    )}>
      {positive ? "+" : ""}{formatMoney(delta)}
    </span>
  );
}

// ── ScenarioPanel ──────────────────────────────────────────────────────────────
export function ScenarioPanel({
  scenario,
  expenseItems,
  baselineResult,
}: {
  scenario: Scenario;
  expenseItems: ExpenseItem[];
  baselineResult: ScenarioResult | null; // conservative used as baseline
}) {
  const savedOverrides: Record<string, number> = scenario.expenseOverrides
    ? JSON.parse(scenario.expenseOverrides)
    : {};

  // Local override state: itemId → pct (0-100)
  const [overrides, setOverrides] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const item of expenseItems) {
      init[item.id] = savedOverrides[item.id] ?? item.businessPct;
    }
    return init;
  });

  const [result, setResult] = useState<ScenarioResult | null>(scenario.result);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced recalculation on slider change
  const recalculate = useCallback(
    (newOverrides: Record<string, number>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        startTransition(async () => {
          const res = await runScenario(scenario.id, newOverrides);
          if (res.data) setResult(res.data as unknown as ScenarioResult);
        });
      }, 300);
    },
    [scenario.id]
  );

  function handleSliderChange(itemId: string, pct: number) {
    const next = { ...overrides, [itemId]: pct };
    setOverrides(next);
    recalculate(next);
  }

  // Run once on mount if no result yet
  useEffect(() => {
    if (!result) {
      startTransition(async () => {
        const res = await runScenario(scenario.id);
        if (res.data) setResult(res.data as unknown as ScenarioResult);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refundNum = result ? parseFloat(result.refund) : null;
  const isRefund = refundNum !== null && refundNum >= 0;

  return (
    <div className={clsx(
      "card flex flex-col gap-0 border-2 transition-colors",
      TYPE_COLOR[scenario.type] ?? "border-gray-700"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className={clsx("badge text-xs font-semibold px-2 py-1", TYPE_BADGE[scenario.type])}>
            {scenario.name}
          </span>
        </div>
        {isPending && (
          <span className="text-xs text-gray-500 animate-pulse">Calculating…</span>
        )}
      </div>

      {/* Expense sliders */}
      {expenseItems.length > 0 && (
        <div className="mb-4">
          <p className="section-title mb-2">Business Use Overrides</p>
          <div className="space-y-2">
            {expenseItems.map((item) => {
              const pct = overrides[item.id] ?? item.businessPct;
              return (
                <div key={item.id}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-gray-400">
                      {CAT_LABELS[item.category] ?? item.category}
                      <span className="text-gray-600 ml-1 truncate max-w-[100px] inline-block align-bottom">
                        {item.description}
                      </span>
                    </span>
                    <span className="text-xs font-medium text-gray-300 tabular-nums w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={pct}
                    onChange={(e) => handleSliderChange(item.id, Number(e.target.value))}
                    className="w-full h-1 accent-indigo-500"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {result ? (
        <div className="space-y-0">
          <p className="section-title">Results</p>
          <ResultRow label="Gross Income"     value={result.grossIncome} />
          <ResultRow label="Allowed Expenses" value={result.allowedExpenses} negative />
          <ResultRow label="Net Profit"       value={result.netProfit} />
          <ResultRow label="SE Tax"           value={result.seTax} negative />
          <ResultRow label="AGI"              value={result.agi} />
          <ResultRow label="Std Deduction"    value={result.standardDeduction} negative />
          <ResultRow label="Taxable Income"   value={result.taxableIncome} />
          <ResultRow label="Income Tax"       value={result.incomeTax} negative />
          {parseFloat(result.totalCredits) > 0 && (
            <ResultRow label="Credits"        value={result.totalCredits} />
          )}
          <ResultRow label="SE Tax"           value={result.seTax} negative />
          <ResultRow label="Total Tax"        value={result.totalTax} negative />

          {/* Refund / Due — highlighted row */}
          <div className={clsx(
            "mt-3 rounded-lg px-3 py-2.5 flex justify-between items-center",
            isRefund ? "bg-green-900/30 border border-green-800" : "bg-red-900/30 border border-red-800"
          )}>
            <div>
              <p className="text-xs font-medium text-gray-300">
                {isRefund ? "Estimated Refund" : "Amount Owed"}
              </p>
              <p className="text-xs text-gray-500">{result.effectiveRate}% eff. rate</p>
            </div>
            <div className="text-right">
              <p className={clsx(
                "text-xl font-bold tabular-nums",
                isRefund ? "text-green-400" : "text-red-400"
              )}>
                {isRefund ? "" : "-"}{formatMoney(Math.abs(parseFloat(result.refund)))}
              </p>
              {baselineResult && (
                <DeltaBadge current={result.refund} baseline={baselineResult.refund} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <p className="text-xs text-gray-500 animate-pulse">Running calculation…</p>
        </div>
      )}
    </div>
  );
}
