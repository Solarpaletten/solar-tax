// app/tax-year/[id]/page.tsx
import { getTaxYearFull } from "@/actions/tax-year";
import { notFound } from "next/navigation";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { IncomeList } from "@/components/workspace/IncomeList";
import { ExpenseList } from "@/components/workspace/ExpenseList";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";
import { AIAssistant } from "@/components/ai/Assistant";
import { SectionHeader, Badge } from "@/components/ui";
import { RichEmptyState } from "@/components/onboarding/RichEmptyState";
import { formatMoney } from "@/lib/money";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TaxYearPage({
  params,
}: {
  params: { id: string };
}) {
  const taxYear = await getTaxYearFull(params.id);
  if (!taxYear) notFound();

  const totalIncome = taxYear.incomeItems.reduce(
    (s, i) => s + parseFloat(i.amount), 0
  );
  const totalAllowed = taxYear.expenseItems.reduce(
    (s, i) => s + parseFloat(i.amount) * (i.businessPct / 100), 0
  );
  const netProfit = totalIncome - totalAllowed;

  const filingLabel =
    taxYear.filingStatus === "MARRIED_FILING_JOINTLY" ? "MFJ"
    : taxYear.filingStatus === "SINGLE" ? "Single"
    : taxYear.filingStatus === "HEAD_OF_HOUSEHOLD" ? "HOH"
    : "MFS";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard" className="text-xs text-gray-600 hover:text-gray-400">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-100">
            {taxYear.year}{" "}
            <span className="text-gray-500 font-normal text-xl">
              {taxYear.household.name}
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="blue">{filingLabel}</Badge>
            {taxYear.dependents.length > 0 && (
              <Badge variant="green">
                {taxYear.dependents.length} dependent{taxYear.dependents.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/tax-year/${taxYear.id}/copy`}
            className="btn-secondary text-xs"
          >
            ⎘ Copy Year
          </Link>
          <Link
            href={`/api/pdf/${taxYear.id}`}
            target="_blank"
            className="btn-secondary text-xs"
          >
            ↓ PDF
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 flex-wrap">
        <div className="card min-w-[120px] text-center">
          <p className="text-xs text-gray-500 mb-1">Gross Income</p>
          <p className="text-lg font-semibold text-green-400 tabular-nums">
            {formatMoney(totalIncome)}
          </p>
        </div>
        <div className="card min-w-[120px] text-center">
          <p className="text-xs text-gray-500 mb-1">Allowed Expenses</p>
          <p className="text-lg font-semibold text-amber-400 tabular-nums">
            {formatMoney(totalAllowed)}
          </p>
        </div>
        <div className="card min-w-[120px] text-center">
          <p className="text-xs text-gray-500 mb-1">Net Profit</p>
          <p className={`text-lg font-semibold tabular-nums ${netProfit >= 0 ? "text-gray-100" : "text-red-400"}`}>
            {formatMoney(netProfit)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <WorkspaceTabs taxYearId={taxYear.id} />

      {/* Two-column inputs layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income */}
        <section className="space-y-4">
          <SectionHeader
            title={`Income · ${taxYear.incomeItems.length} item${taxYear.incomeItems.length !== 1 ? "s" : ""}`}
            action={<IncomeForm taxYearId={taxYear.id} />}
          />
          <IncomeList items={taxYear.incomeItems} taxYearId={taxYear.id} />
        </section>

        {/* Expenses */}
        <section className="space-y-4">
          <SectionHeader
            title={`Expenses · ${taxYear.expenseItems.length} item${taxYear.expenseItems.length !== 1 ? "s" : ""}`}
            action={<ExpenseForm taxYearId={taxYear.id} />}
          />
          <ExpenseList items={taxYear.expenseItems} taxYearId={taxYear.id} />
        </section>
      </div>

      {/* CTA to scenarios */}
      {taxYear.incomeItems.length > 0 && (
        <div className="rounded-xl border border-indigo-800 bg-indigo-950/30 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-300">Ready to simulate?</p>
            <p className="text-xs text-indigo-500 mt-0.5">
              See how expense choices affect your tax across 3 scenarios.
            </p>
          </div>
          <Link href={`/tax-year/${taxYear.id}/scenarios`} className="btn-primary whitespace-nowrap">
            View Scenarios ⚡
          </Link>
        </div>
      )}

      {/* Dependents */}
      {taxYear.dependents.length > 0 && (
        <section>
          <SectionHeader title="Dependents" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {taxYear.dependents.map((dep) => (
              <div key={dep.id} className="card text-sm">
                <p className="font-medium text-gray-200">
                  {dep.firstName} {dep.lastName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {dep.relationship} · {dep.months}mo
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <AIAssistant />
    </div>
  );
}
