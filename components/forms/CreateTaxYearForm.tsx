// components/forms/CreateTaxYearForm.tsx
"use client";

import { useState, useTransition } from "react";
import { createHousehold } from "@/actions/household";
import { createTaxYear } from "@/actions/tax-year";
import { useRouter } from "next/navigation";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export function CreateTaxYearForm({
  householdId,
  existingYears,
}: {
  householdId?: string;
  existingYears?: number[];
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"new-household" | "existing">(
    householdId ? "existing" : "new-household"
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      let hId = householdId;

      if (mode === "new-household") {
        const hhName = fd.get("householdName") as string;
        const hhResult = await createHousehold(hhName);
        if (hhResult.error || !hhResult.data) {
          setError(hhResult.error ?? "Failed to create household");
          return;
        }
        hId = hhResult.data.id;
      }

      const year = parseInt(fd.get("year") as string, 10);
      const result = await createTaxYear(hId!, year);
      if (result.error || !result.data) {
        setError(result.error ?? "Failed to create tax year");
        return;
      }

      router.push(`/tax-year/${result.data.id}`);
    });
  }

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + New Tax Year
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card border-indigo-800 space-y-4 max-w-md">
      <p className="text-sm font-semibold text-indigo-400">New Tax Year</p>

      {!householdId && (
        <div>
          <label className="label">Household Name</label>
          <input
            name="householdName"
            required={mode === "new-household"}
            placeholder="e.g. Smith Family"
            className="input"
          />
          <p className="text-xs text-gray-500 mt-1">
            Groups tax years for the same household.
          </p>
        </div>
      )}

      <div>
        <label className="label">Tax Year</label>
        <select name="year" required className="select">
          {YEARS.map((y) => {
            const taken = existingYears?.includes(y);
            return (
              <option key={y} value={y} disabled={taken}>
                {y}{taken ? " (already exists)" : ""}
              </option>
            );
          })}
        </select>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => { setOpen(false); setError(null); }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
