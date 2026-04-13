// components/forms/IncomeForm.tsx
"use client";

import { useState, useTransition } from "react";
import { addIncomeItem } from "@/actions/income";

const INCOME_TYPES = [
  { value: "FORM_1099_NEC",  label: "1099-NEC (Self-Employment)" },
  { value: "W2",             label: "W-2 (Employment)" },
  { value: "FORM_1099_MISC", label: "1099-MISC" },
  { value: "FORM_1099_K",    label: "1099-K" },
  { value: "INTEREST",       label: "Interest" },
  { value: "DIVIDEND",       label: "Dividend" },
  { value: "OTHER",          label: "Other" },
];

export function IncomeForm({ taxYearId }: { taxYearId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addIncomeItem({
        taxYearId,
        type:        fd.get("type") as string,
        source:      fd.get("source") as string,
        amount:      fd.get("amount") as string,
        withholding: (fd.get("withholding") as string) || "0",
        notes:       (fd.get("notes") as string) || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  if (!open) {
    return (
      <button className="btn-primary text-xs" onClick={() => setOpen(true)}>
        + Add Income
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card border-indigo-800 space-y-3">
      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
        New Income Item
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Type</label>
          <select name="type" required className="select">
            {INCOME_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Source / Payer</label>
          <input
            name="source"
            required
            placeholder="e.g. Acme Corp, Client Name"
            className="input"
          />
        </div>
        <div>
          <label className="label">Amount ($)</label>
          <input
            name="amount"
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="input"
          />
        </div>
        <div>
          <label className="label">Withholding ($)</label>
          <input
            name="withholding"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            defaultValue="0"
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">Notes (optional)</label>
        <input name="notes" placeholder="Optional notes" className="input" />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Saving…" : "Save Income"}
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
