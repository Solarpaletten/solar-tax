// app/tax-year/[id]/report/page.tsx
export const dynamic = "force-dynamic";

import { generateIRSReport } from "@/actions/report";
import { getTaxYearFull }    from "@/actions/tax-year";
import { notFound }          from "next/navigation";
import { WorkspaceTabs }     from "@/components/workspace/WorkspaceTabs";
import Link                  from "next/link";
import { fmtDollar, expenseCategoryLabel } from "@/lib/reporting/format";
import type { IRS1040Report } from "@/lib/reporting/types";

export default async function ReportPage({ params }: { params: { id: string } }) {
  const taxYear = await getTaxYearFull(params.id);
  if (!taxYear) return notFound();

  let report: IRS1040Report | null = null;
  let error: string | null = null;

  try {
    report = await generateIRSReport(params.id);
  } catch (e: any) {
    error = e.message;
  }

  const downloadUrl = `/api/report/${params.id}`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
          <span className="mx-2">/</span>
          <Link href={`/tax-year/${params.id}`} className="hover:text-gray-300">
            {taxYear.year} {taxYear.household?.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">IRS Report</span>
        </nav>

        <WorkspaceTabs taxYearId={params.id} />

        {/* Header */}
        <div className="mt-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">IRS 1040 Planning Report</h1>
            <p className="text-gray-400 text-sm mt-1">
              For planning purposes only — not a filed return
            </p>
          </div>
          <a
            href={downloadUrl}
            download
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
            </svg>
            Export IRS-ready PDF
          </a>
        </div>

        {error && (
          <div className="mt-6 bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {report && (
          <div className="mt-6 space-y-6">
            {/* Taxpayer card */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-white">{report.taxpayerName}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Tax Year {report.taxYear} · {report.filingStatus} · Scenario: {report.scenarioUsed}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Generated</div>
                  <div className="text-sm text-gray-300">
                    {new Date(report.generatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Total Income",   value: report.line9,   color: "text-white" },
                { label: "AGI",            value: report.line11,  color: "text-white" },
                { label: "Taxable Income", value: report.line15,  color: "text-white" },
                { label: "Total Tax",      value: report.line24,  color: "text-red-400" },
                { label: "Withholding",    value: report.line25d ?? "0", color: "text-white" },
                {
                  label: report.line37 ? "Amount Owed" : "Refund",
                  value: report.line37 ?? report.line35a ?? "0",
                  color: report.line37 ? "text-red-400" : "text-green-400",
                },
              ].map(c => (
                <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{c.label}</div>
                  <div className={`text-2xl font-bold ${c.color}`}>
                    ${fmtDollar(c.value)}
                  </div>
                </div>
              ))}
            </div>

            {/* 1040 Lines */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="font-semibold text-white">Form 1040 — Line Summary</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {([
                  ["Line 1a", "W-2 Wages",                         report.line1a],
                  ["Line 8",  "Additional Income (Schedule 1)",    report.line8],
                  ["Line 9",  "Total Income",                      report.line9],
                  ["Line 10", "Adjustments to Income",             report.line10],
                  ["Line 11", "Adjusted Gross Income",             report.line11],
                  ["Line 12", "Standard Deduction",                report.line12],
                  ["Line 14", "Total Deductions",                  report.line14],
                  ["Line 15", "Taxable Income",                    report.line15],
                  ["Line 16", "Income Tax",                        report.line16],
                  ["Line 19", "Child Tax Credit",                  report.line19],
                  ["Line 22", "Tax After Credits",                 report.line22],
                  ["Line 23", "Self-Employment Tax",               report.line23],
                  ["Line 24", "Total Tax",                         report.line24],
                  ["Line 25d","Total Withholding",                 report.line25d],
                  ["Line 33", "Total Payments",                    report.line33],
                  ["Line 35a","Refund",                            report.line35a],
                  ["Line 37", "Amount You Owe",                    report.line37],
                ] as [string, string, string | undefined][])
                  .filter(([,, v]) => v !== undefined)
                  .map(([num, label, value]) => {
                    const isKey = num === "Line 24" || num === "Line 37" || num === "Line 35a";
                    return (
                      <div key={num} className={`flex items-center justify-between px-6 py-3 ${isKey ? "bg-gray-800/50" : ""}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-blue-400 w-14">{num}</span>
                          <span className={`text-sm ${isKey ? "font-semibold text-white" : "text-gray-300"}`}>{label}</span>
                        </div>
                        <span className={`font-mono text-sm font-semibold ${
                          num === "Line 37" ? "text-red-400" :
                          num === "Line 35a" ? "text-green-400" : "text-white"
                        }`}>
                          ${fmtDollar(value)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Income items */}
            {report.incomeItems.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h2 className="font-semibold text-white">Income Sources</h2>
                </div>
                <div className="divide-y divide-gray-800">
                  {report.incomeItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <div className="text-sm text-white">{item.source}</div>
                        <div className="text-xs text-gray-500">{item.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">${fmtDollar(item.amount)}</div>
                        {parseFloat(item.withholding) > 0 && (
                          <div className="text-xs text-gray-500">Withheld: ${fmtDollar(item.withholding)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expense items */}
            {report.expenseItems.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h2 className="font-semibold text-white">Business Expenses</h2>
                </div>
                <div className="divide-y divide-gray-800">
                  {report.expenseItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <div className="text-sm text-white">{item.description}</div>
                        <div className="text-xs text-gray-500">{expenseCategoryLabel(item.category)} · {item.businessPct}% business</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-400">${fmtDollar(item.allowed)}</div>
                        <div className="text-xs text-gray-500">of ${fmtDollar(item.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dependents */}
            {report.dependents.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h2 className="font-semibold text-white">Dependents</h2>
                </div>
                <div className="divide-y divide-gray-800">
                  {report.dependents.map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3">
                      <div className="text-sm text-white">{d.firstName} {d.lastName}</div>
                      <div className="text-xs text-gray-500">{d.relationship} · {d.months} months</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-yellow-950/30 border border-yellow-800/50 rounded-xl p-4">
              <p className="text-xs text-yellow-300/80">
                {report.notes?.join(" ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
