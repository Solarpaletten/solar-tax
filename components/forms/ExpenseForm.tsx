// components/forms/ExpenseForm.tsx
"use client";

import { useState, useTransition } from "react";
import { addExpenseItem } from "@/actions/expenses";

const EXPENSE_CATEGORIES = [
  { value: "AUTO",              label: "Auto / Vehicle" },
  { value: "PHONE",             label: "Phone" },
  { value: "HOME_OFFICE",       label: "Home Office" },
  { value: "SUPPLIES",          label: "Supplies" },
  { value: "MEALS",             label: "Meals (50% limit)" },
  { value: "TRAVEL",            label: "Travel" },
  { value: "INSURANCE",         label: "Insurance" },
  { value: "SOFTWARE",          label: "Software / Subscriptions" },
  { value: "MARKETING",         label: "Marketing / Advertising" },
  { value: "PROFESSIONAL_FEES", label: "Professional Fees" },
  { value: "OTHER",             label: "Other" },
];

export function ExpenseForm({ taxYearId }: { taxYearId: string }) {
  const [open, setOpen] = useState(false);
  const [businessPct, setBusinessPct] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addExpenseItem({
        taxYearId,
        category:    fd.get("category") as string,
        description: fd.get("description") as string,
        amount:      fd.get("amount") as string,
        businessPct,
        notes:       (fd.get("notes") as string) || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setBusinessPct(100);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  const allowedPct = businessPct;

  if (!open) {
    return (
      <button className="btn-primary text-xs" onClick={() => setOpen(true)}>
        + Add Expense
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card border-emerald-900 space-y-3">
      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
        New Expense Item
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select name="category" required className="select">
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <input
            name="description"
            required
            placeholder="Brief description"
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
          <label className="label">
            Business Use — {allowedPct}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={businessPct}
            onChange={(e) => setBusinessPct(Number(e.target.value))}
            className="w-full accent-emerald-500 mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            {allowedPct}% business → allowed deduction
          </p>
        </div>
      </div>

      <div>
        <label className="label">Notes (optional)</label>
        <input name="notes" placeholder="Optional notes" className="input" />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Saving…" : "Save Expense"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => { setOpen(false); setError(null); setBusinessPct(100); }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
