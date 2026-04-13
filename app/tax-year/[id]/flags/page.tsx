// app/tax-year/[id]/flags/page.tsx
import { getTaxYearFull } from "@/actions/tax-year";
import { refreshAuditFlags } from "@/actions/audit-flags";
import { notFound } from "next/navigation";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";
import { AIAssistant } from "@/components/ai/Assistant";
import { EmptyState } from "@/components/ui";
import Link from "next/link";
import { clsx } from "clsx";

export const dynamic = "force-dynamic";

const SEVERITY_CONFIG = {
  CRITICAL: {
    border:  "border-red-800",
    bg:      "bg-red-950/40",
    badge:   "bg-red-900 text-red-300",
    icon:    "🔴",
    label:   "Critical",
  },
  WARNING: {
    border:  "border-yellow-800",
    bg:      "bg-yellow-950/30",
    badge:   "bg-yellow-900 text-yellow-300",
    icon:    "🟡",
    label:   "Warning",
  },
  INFO: {
    border:  "border-blue-800",
    bg:      "bg-blue-950/30",
    badge:   "bg-blue-900 text-blue-300",
    icon:    "🔵",
    label:   "Info",
  },
};

export default async function FlagsPage({
  params,
}: {
  params: { id: string };
}) {
  // Refresh flags on every visit (run against latest BALANCED result)
  await refreshAuditFlags(params.id);

  const taxYear = await getTaxYearFull(params.id);
  if (!taxYear) notFound();

  const flags = taxYear.auditFlags;

  const criticalCount = flags.filter((f) => f.severity === "CRITICAL").length;
  const warningCount  = flags.filter((f) => f.severity === "WARNING").length;
  const infoCount     = flags.filter((f) => f.severity === "INFO").length;

  const ordered = [
    ...flags.filter((f) => f.severity === "CRITICAL"),
    ...flags.filter((f) => f.severity === "WARNING"),
    ...flags.filter((f) => f.severity === "INFO"),
  ];

  const hasScenarioResults = taxYear.scenarios.some((s) => s.result);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Link href="/dashboard" className="hover:text-gray-400">Dashboard</Link>
        <span>/</span>
        <Link href={`/tax-year/${taxYear.id}`} className="hover:text-gray-400">
          {taxYear.year} {taxYear.household.name}
        </Link>
        <span>/</span>
        <span className="text-gray-400">Audit Risk</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Audit Risk Flags</h1>
          <p className="text-sm text-gray-500 mt-1">
            Rule-based review of your {taxYear.year} return inputs against IRS statistical norms.
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <span className="badge badge-red">{criticalCount} Critical</span>
          )}
          {warningCount > 0 && (
            <span className="badge badge-yellow">{warningCount} Warning{warningCount !== 1 ? "s" : ""}</span>
          )}
          {infoCount > 0 && (
            <span className="badge badge-blue">{infoCount} Info</span>
          )}
          {flags.length === 0 && (
            <span className="badge badge-green">No flags</span>
          )}
        </div>
      </div>

      <WorkspaceTabs taxYearId={taxYear.id} />

      {/* No scenario results yet */}
      {!hasScenarioResults && (
        <div className="rounded-lg border border-amber-800 bg-amber-950/30 px-4 py-4 text-sm text-amber-300">
          ⚠ Run your scenarios first to generate audit flags.{" "}
          <Link href={`/tax-year/${taxYear.id}/scenarios`} className="underline hover:text-amber-200">
            Go to Scenarios →
          </Link>
        </div>
      )}

      {/* Clean bill of health */}
      {hasScenarioResults && flags.length === 0 && (
        <EmptyState
          icon="✅"
          title="No audit flags detected"
          description="Your current inputs don't match any known audit risk patterns. This is not a guarantee — always review your return carefully."
        />
      )}

      {/* Disclaimer */}
      {flags.length > 0 && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-xs text-gray-500">
          <span className="font-medium text-gray-400">Disclaimer:</span> These flags are
          rule-based estimates based on common IRS audit patterns. They are not legal or tax advice.
          Consult a qualified tax professional before filing. Flags are based on the{" "}
          <span className="text-gray-400">Balanced scenario</span>.
        </div>
      )}

      {/* Flag cards */}
      <div className="space-y-3">
        {ordered.map((flag) => {
          const cfg = SEVERITY_CONFIG[flag.severity as keyof typeof SEVERITY_CONFIG];
          return (
            <div
              key={flag.id}
              className={clsx(
                "rounded-xl border-2 px-5 py-4 space-y-2",
                cfg.border,
                cfg.bg
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{cfg.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx("badge text-xs font-semibold", cfg.badge)}>
                      {cfg.label}
                    </span>
                    <code className="text-xs text-gray-500 font-mono">{flag.code}</code>
                  </div>
                  <p className="text-sm font-medium text-gray-200 mt-1">{flag.message}</p>
                </div>
              </div>
              {flag.detail && (
                <p className="text-xs text-gray-400 leading-relaxed pl-8">
                  {flag.detail}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Nav */}
      <div className="flex gap-3 pt-2">
        <Link href={`/tax-year/${taxYear.id}/scenarios`} className="btn-secondary">
          ← Scenarios
        </Link>
        <Link
          href={`/api/pdf/${taxYear.id}`}
          target="_blank"
          className="btn-secondary"
        >
          ↓ Export PDF
        </Link>
      </div>

      <AIAssistant />
    </div>
  );
}
