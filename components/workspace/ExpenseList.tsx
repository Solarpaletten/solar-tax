// components/workspace/ExpenseList.tsx
"use client";

import { deleteExpenseItem } from "@/actions/expenses";
import { formatMoney } from "@/lib/money";
import { useTransition } from "react";

type ExpenseItem = {
  id: string;
  category: string;
  description: string;
  amount: string;
  businessPct: number;
  taxYearId: string;
};

const CAT_LABELS: Record<string, string> = {
  AUTO:              "Auto",
  PHONE:             "Phone",
  HOME_OFFICE:       "Home Office",
  SUPPLIES:          "Supplies",
  MEALS:             "Meals",
  TRAVEL:            "Travel",
  INSURANCE:         "Insurance",
  SOFTWARE:          "Software",
  MARKETING:         "Marketing",
  PROFESSIONAL_FEES: "Professional",
  OTHER:             "Other",
};

export function ExpenseList({
  items,
  taxYearId,
}: {
  items: ExpenseItem[];
  taxYearId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const totalAmount  = items.reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalAllowed = items.reduce(
    (s, i) => s + parseFloat(i.amount) * (i.businessPct / 100),
    0
  );

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-600 py-4">
        No expense items yet. Add your first one above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const allowed = parseFloat(item.amount) * (item.businessPct / 100);
        return (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-emerald-400 bg-emerald-950 rounded px-1.5 py-0.5">
                  {CAT_LABELS[item.category] ?? item.category}
                </span>
                <span className="text-sm text-gray-200 truncate">{item.description}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-500">
                  {item.businessPct}% business
                </span>
                <span className="text-xs text-gray-600">
                  Allowed: {formatMoney(allowed)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <span className="text-sm font-semibold tabular-nums text-gray-300">
                {formatMoney(item.amount)}
              </span>
              <button
                disabled={isPending}
                onClick={() => startTransition(() => deleteExpenseItem(item.id, taxYearId))}
                className="btn-danger"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}

      {/* Totals */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 mt-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Total expenses</span>
          <span className="tabular-nums">{formatMoney(totalAmount)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Allowed deduction</span>
          <span className="font-semibold text-emerald-400 tabular-nums">
            {formatMoney(totalAllowed)}
          </span>
        </div>
        {totalAmount > 0 && (
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Avg business use</span>
            <span className="tabular-nums">
              {Math.round((totalAllowed / totalAmount) * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
