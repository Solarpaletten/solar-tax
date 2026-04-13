// app/tax-year/[id]/copy/page.tsx
"use client";

import { useState, useTransition } from "react";
import { copyYear } from "@/actions/copy-year";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CURRENT_YEAR = new Date().getFullYear();

export default function CopyYearPage({
  params,
}: {
  params: { id: string };
}) {
  const [targetYear, setTargetYear]     = useState(CURRENT_YEAR + 1);
  const [dependents, setDependents]     = useState(true);
  const [expenses, setExpenses]         = useState(true);
  const [scenarios, setScenarios]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await copyYear(params.id, targetYear, {
        dependents,
        expenseStructure:  expenses,
        scenarioStructure: scenarios,
      });
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        router.push(`/tax-year/${result.data.id}`);
      }
    });
  }

  const years = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1].filter(
    (y) => y >= 2023
  );

  return (
    <div className="max-w-lg space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Link href="/dashboard" className="hover:text-gray-400">Dashboard</Link>
        <span>/</span>
        <Link href={`/tax-year/${params.id}`} className="hover:text-gray-400">Tax Year</Link>
        <span>/</span>
        <span className="text-gray-400">Copy Year</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-100">Copy to New Year</h1>
        <p className="text-sm text-gray-500 mt-1">
          Copies the structure and ratios. Dollar amounts will be zeroed out.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Target year */}
        <div className="card space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Year</p>
          <div className="flex gap-3">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setTargetYear(y)}
                className={`flex-1 rounded-lg border py-3 text-center text-sm font-semibold transition-colors ${
                  targetYear === y
                    ? "border-indigo-500 bg-indigo-950 text-indigo-300"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* What to copy */}
        <div className="card space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What to Copy</p>

          {[
            {
              id: "dependents",
              label: "Dependents",
              description: "Names, relationships, months — no SSN",
              value: dependents,
              set: setDependents,
            },
            {
              id: "expenses",
              label: "Expense structure",
              description: "Categories + business % ratios, amounts zeroed",
              value: expenses,
              set: setExpenses,
            },
            {
              id: "scenarios",
              label: "Scenario overrides",
              description: "Business % adjustments per scenario",
              value: scenarios,
              set: setScenarios,
            },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={item.value}
                  onChange={(e) => item.set(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    item.value
                      ? "border-indigo-500 bg-indigo-600"
                      : "border-gray-600 bg-gray-800"
                  }`}
                >
                  {item.value && (
                    <span className="text-white text-xs font-bold">✓</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200">{item.label}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Always zeroed note */}
        <div className="rounded-lg border border-amber-800 bg-amber-950/30 px-4 py-3 text-xs text-amber-300">
          <span className="font-semibold">Note:</span> Income items and expense dollar amounts are always
          zeroed out. You update the actual figures once you&apos;re in the new year workspace.
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary flex-1"
          >
            {isPending ? "Copying…" : `Create ${targetYear} →`}
          </button>
          <Link href={`/tax-year/${params.id}`} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
