// components/optimize/ApplySuggestion.tsx
// Restricted: ONLY changes expense businessPct.
// Cannot touch income, dependents, filing status, or any other field.
"use client";

import { useTransition, useState } from "react";
import { runScenario } from "@/actions/scenario";
import { clsx } from "clsx";

interface Props {
  taxYearId:  string;
  scenarioIds: string[];           // run all 3 after applying
  expenseId:  string;
  newPct:     number;
  currentPct: number;
}

export function ApplySuggestion({
  taxYearId,
  scenarioIds,
  expenseId,
  newPct,
  currentPct,
}: Props) {
  const [applied, setApplied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleApply() {
    startTransition(async () => {
      // Apply the override to all 3 scenarios simultaneously
      await Promise.all(
        scenarioIds.map(id => runScenario(id, { [expenseId]: newPct }))
      );
      setApplied(true);
    });
  }

  if (applied) {
    return (
      <span className="text-xs text-green-400 font-medium">
        ✓ Applied — refresh Scenarios to see updated results
      </span>
    );
  }

  return (
    <button
      onClick={handleApply}
      disabled={isPending}
      className={clsx(
        "text-xs px-3 py-1 rounded-lg border font-medium transition-colors",
        "border-indigo-700 bg-indigo-950 text-indigo-300 hover:bg-indigo-900 hover:border-indigo-500",
        "disabled:opacity-40"
      )}
    >
      {isPending
        ? "Applying…"
        : `Apply: set to ${newPct}% (from ${currentPct}%)`}
    </button>
  );
}
