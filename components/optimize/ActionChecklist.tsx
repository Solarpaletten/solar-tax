// components/optimize/ActionChecklist.tsx
"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { ActionItem } from "@/lib/optimization/types";

const PRIORITY_COLOR: Record<string, string> = {
  HIGH:   "text-red-400",
  MEDIUM: "text-amber-400",
  LOW:    "text-gray-500",
};
const PRIORITY_DOT: Record<string, string> = {
  HIGH:   "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW:    "bg-gray-600",
};

export function ActionChecklist({ items }: { items: ActionItem[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(code: string) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const done  = items.filter(i => checked.has(i.code)).length;
  const total = items.length;

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
          {done} / {total}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isDone = checked.has(item.code);
          return (
            <button
              key={item.code}
              onClick={() => toggle(item.code)}
              className={clsx(
                "w-full text-left rounded-xl border px-4 py-3 transition-all",
                isDone
                  ? "border-gray-700 bg-gray-800/30 opacity-60"
                  : "border-gray-800 bg-gray-900 hover:border-gray-600"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className={clsx(
                  "mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  isDone ? "border-indigo-500 bg-indigo-600" : "border-gray-600"
                )}>
                  {isDone && <span className="text-white text-xs">✓</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={clsx(
                      "text-sm font-medium",
                      isDone ? "text-gray-500 line-through" : "text-gray-200"
                    )}>
                      {item.label}
                    </span>
                    <span className={clsx(
                      "flex-shrink-0 w-1.5 h-1.5 rounded-full",
                      PRIORITY_DOT[item.priority]
                    )} />
                  </div>
                  <p className={clsx(
                    "text-xs leading-relaxed",
                    isDone ? "text-gray-600" : "text-gray-500"
                  )}>
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
