// app/tax-year/[id]/scenarios/page.tsx
import { getTaxYearFull } from "@/actions/tax-year";
import { runAllScenarios } from "@/actions/scenario";
import { notFound } from "next/navigation";
import { ScenarioPanel } from "@/components/scenario/ScenarioPanel";
import { AIAssistant } from "@/components/ai/Assistant";
import { formatMoney } from "@/lib/money";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ScenariosPage({
  params,
}: {
  params: { id: string };
}) {
  const taxYear = await getTaxYearFull(params.id);
  if (!taxYear) notFound();

  // Run all scenarios on load so results are fresh
  await runAllScenarios(taxYear.id);

  // Re-fetch with fresh results
  const fresh = await getTaxYearFull(params.id);
  if (!fresh) notFound();

  const scenarios = fresh.scenarios.sort((a, b) =>
    ["CONSERVATIVE", "BALANCED", "AGGRESSIVE"].indexOf(a.type) -
    ["CONSERVATIVE", "BALANCED", "AGGRESSIVE"].indexOf(b.type)
  );

  const conservative = scenarios.find((s) => s.type === "CONSERVATIVE");
  const baselineResult = conservative?.result ?? null;

  const hasIncome = fresh.incomeItems.length > 0;
  const hasExpenses = fresh.expenseItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Link href="/dashboard" className="hover:text-gray-400">Dashboard</Link>
        <span>/</span>
        <Link href={`/tax-year/${taxYear.id}`} className="hover:text-gray-400">
          {fresh.year} {fresh.household.name}
        </Link>
        <span>/</span>
        <span className="text-gray-400">Scenarios</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-100">
          Scenario Simulation
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Adjust expense business-use percentages per scenario. Results update in real-time.
        </p>
      </div>

      {/* Data warnings */}
      {!hasIncome && (
        <div className="rounded-lg border border-amber-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
          ⚠ No income items yet.{" "}
          <Link href={`/tax-year/${taxYear.id}`} className="underline hover:text-amber-200">
            Add income
          </Link>{" "}
          to see meaningful results.
        </div>
      )}
      {!hasExpenses && (
        <div className="rounded-lg border border-blue-800 bg-blue-950/30 px-4 py-3 text-sm text-blue-300">
          ℹ No expense items.{" "}
          <Link href={`/tax-year/${taxYear.id}`} className="underline hover:text-blue-200">
            Add expenses
          </Link>{" "}
          to see scenario differences.
        </div>
      )}

      {/* Summary comparison bar */}
      {baselineResult && (
        <div className="grid grid-cols-3 gap-3">
          {scenarios.map((s) => {
            if (!s.result) return null;
            const refundNum = parseFloat(s.result.refund);
            const isRefund = refundNum >= 0;
            return (
              <div key={s.id} className="card text-center">
                <p className="text-xs text-gray-500 mb-1">{s.name}</p>
                <p className={`text-lg font-bold tabular-nums ${isRefund ? "text-green-400" : "text-red-400"}`}>
                  {isRefund ? "+" : ""}{formatMoney(refundNum)}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {s.result.effectiveRate}% eff. rate
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Three scenario panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {scenarios.map((scenario, i) => (
          <ScenarioPanel
            key={scenario.id}
            scenario={{
              id:               scenario.id,
              type:             scenario.type,
              name:             scenario.name,
              expenseOverrides: scenario.expenseOverrides,
              result:           scenario.result as any,
            }}
            expenseItems={fresh.expenseItems.map((e) => ({
              id:          e.id,
              category:    e.category,
              description: e.description,
              amount:      e.amount,
              businessPct: e.businessPct,
            }))}
            baselineResult={i === 0 ? null : (baselineResult as any)}
          />
        ))}
      </div>

      {/* Nav */}
      <div className="flex gap-3 pt-2">
        <Link href={`/tax-year/${taxYear.id}`} className="btn-secondary">
          ← Inputs
        </Link>
      </div>

      <AIAssistant />
    </div>
  );
}
