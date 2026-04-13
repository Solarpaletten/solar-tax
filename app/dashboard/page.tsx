// app/dashboard/page.tsx
import { getHouseholds } from "@/actions/household";
import { CreateTaxYearForm } from "@/components/forms/CreateTaxYearForm";
import { AIAssistant } from "@/components/ai/Assistant";
import { AppShell } from "@/components/layout/AppShell";
import { RichEmptyState } from "@/components/onboarding/RichEmptyState";
import { Badge } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const households = await getHouseholds();
  const totalYears = households.reduce((n, h) => n + h.taxYears.length, 0);
  const isDemo = (name: string) => name.startsWith("Demo:");

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-100">Tax Years</h1>
            <p className="mt-1 text-sm text-gray-500">
              {totalYears === 0
                ? "Start optimizing — not just filing."
                : `${totalYears} tax year${totalYears !== 1 ? "s" : ""} · ${households.length} household${households.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {totalYears > 0 && <CreateTaxYearForm />}
        </div>

        {households.length === 0 && <RichEmptyState context="no-tax-years" />}

        {households.map((household) => (
          <div key={household.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-gray-300">
                {household.name}
                {isDemo(household.name) && (
                  <span className="ml-2 badge bg-indigo-900 text-indigo-400 text-xs">Demo</span>
                )}
              </p>
              <span className="text-gray-700">·</span>
              <p className="text-xs text-gray-600">
                {household.taxYears.length} year{household.taxYears.length !== 1 ? "s" : ""}
              </p>
              <CreateTaxYearForm
                householdId={household.id}
                existingYears={household.taxYears.map((y) => y.year)}
              />
            </div>

            {household.taxYears.length === 0 ? (
              <div className="card text-center py-6 text-sm text-gray-600">No tax years yet</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {household.taxYears.map((ty) => (
                  <Link
                    key={ty.id}
                    href={`/tax-year/${ty.id}/optimize`}
                    className="card hover:border-gray-600 hover:bg-gray-800/60 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-2xl font-bold text-gray-100 group-hover:text-indigo-300 transition-colors">
                          {ty.year}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {ty.filingStatus.replace(/_/g, " ")}
                        </p>
                      </div>
                      <Badge variant="gray">
                        {ty.filingStatus === "MARRIED_FILING_JOINTLY" ? "MFJ"
                          : ty.filingStatus === "SINGLE" ? "Single"
                          : ty.filingStatus === "HEAD_OF_HOUSEHOLD" ? "HOH"
                          : "MFS"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      {new Date(ty.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric"
                      })}
                    </p>
                    <p className="mt-3 text-xs text-indigo-500 group-hover:text-indigo-400">
                      Open Optimization →
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        <AIAssistant />
      </div>
    </AppShell>
  );
}
