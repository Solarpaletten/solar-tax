// components/workspace/IncomeList.tsx
"use client";

import { deleteIncomeItem } from "@/actions/income";
import { formatMoney } from "@/lib/money";
import { useTransition } from "react";

type IncomeItem = {
  id: string;
  type: string;
  source: string;
  amount: string;
  withholding: string;
  taxYearId: string;
};

const TYPE_LABELS: Record<string, string> = {
  W2:             "W-2",
  FORM_1099_NEC:  "1099-NEC",
  FORM_1099_MISC: "1099-MISC",
  FORM_1099_K:    "1099-K",
  INTEREST:       "Interest",
  DIVIDEND:       "Dividend",
  OTHER:          "Other",
};

export function IncomeList({ items, taxYearId }: { items: IncomeItem[]; taxYearId: string }) {
  const [isPending, startTransition] = useTransition();

  const totalIncome = items.reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalWithholding = items.reduce((s, i) => s + parseFloat(i.withholding), 0);

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-600 py-4">No income items yet. Add your first one above.</p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-indigo-400 bg-indigo-950 rounded px-1.5 py-0.5">
                {TYPE_LABELS[item.type] ?? item.type}
              </span>
              <span className="text-sm text-gray-200 truncate">{item.source}</span>
            </div>
            {parseFloat(item.withholding) > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                Withheld: {formatMoney(item.withholding)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 ml-4">
            <span className="text-sm font-semibold tabular-nums text-green-400">
              {formatMoney(item.amount)}
            </span>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => deleteIncomeItem(item.id, taxYearId))}
              className="btn-danger"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {/* Totals */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 mt-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Total income</span>
          <span className="font-semibold text-green-400 tabular-nums">
            {formatMoney(totalIncome)}
          </span>
        </div>
        {totalWithholding > 0 && (
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Total withholding</span>
            <span className="tabular-nums">{formatMoney(totalWithholding)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
