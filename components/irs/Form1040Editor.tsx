// components/irs/Form1040Editor.tsx
"use client";

import { useState } from "react";
import { fmtDollar } from "@/lib/reporting/format";
import type { IRS1040Report } from "@/lib/reporting/types";

type Field = {
  key: keyof IRS1040Report;
  label: string;
  line: string;
  section: "income" | "deductions" | "tax" | "payments";
};

const FIELDS: Field[] = [
  { key: "line1a",  line: "1a",  label: "W-2 Wages",                      section: "income" },
  { key: "line8",   line: "8",   label: "Additional Income (Schedule 1)",  section: "income" },
  { key: "line9",   line: "9",   label: "Total Income",                    section: "income" },
  { key: "line10",  line: "10",  label: "Adjustments to Income",           section: "income" },
  { key: "line11",  line: "11",  label: "Adjusted Gross Income (AGI)",     section: "income" },
  { key: "line12",  line: "12",  label: "Standard Deduction",              section: "deductions" },
  { key: "line15",  line: "15",  label: "Taxable Income",                  section: "deductions" },
  { key: "line16",  line: "16",  label: "Income Tax",                      section: "tax" },
  { key: "line19",  line: "19",  label: "Child Tax Credit",                section: "tax" },
  { key: "line23",  line: "23",  label: "Self-Employment Tax",             section: "tax" },
  { key: "line24",  line: "24",  label: "Total Tax",                       section: "tax" },
  { key: "line25d", line: "25d", label: "Total Withholding",               section: "payments" },
  { key: "line33",  line: "33",  label: "Total Payments",                  section: "payments" },
  { key: "line35a", line: "35a", label: "Refund",                          section: "payments" },
  { key: "line37",  line: "37",  label: "Amount You Owe",                  section: "payments" },
];

const SECTION_LABELS = {
  income:     "Income",
  deductions: "Deductions",
  tax:        "Tax & Credits",
  payments:   "Payments & Refund",
};

const SECTION_COLORS = {
  income:     "text-blue-400",
  deductions: "text-purple-400",
  tax:        "text-red-400",
  payments:   "text-green-400",
};

type Props = {
  report: IRS1040Report;
};

export default function Form1040Editor({ report }: Props) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  const toggleOverride = (key: string, systemVal: string) => {
    setEnabled(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (next[key] && !overrides[key]) {
        setOverrides(o => ({ ...o, [key]: systemVal ?? "0" }));
      }
      return next;
    });
  };

  const handleChange = (key: string, val: string) => {
    setOverrides(prev => ({ ...prev, [key]: val }));
  };

  const sections = ["income", "deductions", "tax", "payments"] as const;

  const overrideCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Form 1040 — Manual Override</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            System values from engine. Enable override to enter manual amounts.
          </p>
        </div>
        {overrideCount > 0 && (
          <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-lg px-3 py-1.5">
            <span className="text-xs text-yellow-300">{overrideCount} override{overrideCount > 1 ? "s" : ""} active</span>
          </div>
        )}
      </div>

      {sections.map(section => {
        const sectionFields = FIELDS.filter(f => f.section === section);
        return (
          <div key={section} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${SECTION_COLORS[section]}`}>
                {SECTION_LABELS[section]}
              </span>
            </div>
            <div className="divide-y divide-gray-800">
              {sectionFields.map(f => {
                const systemVal = (report[f.key] as string) ?? "0";
                const isEnabled = enabled[f.key] ?? false;
                const displayVal = isEnabled ? (overrides[f.key] ?? systemVal) : systemVal;
                const isModified = isEnabled && overrides[f.key] !== systemVal;

                return (
                  <div key={f.key} className={`px-5 py-3 ${isEnabled ? "bg-yellow-950/20" : ""}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-blue-400 w-10 shrink-0">
                          {f.line}
                        </span>
                        <span className="text-sm text-gray-300 truncate">{f.label}</span>
                        {isModified && (
                          <span className="text-xs bg-yellow-800/50 text-yellow-300 px-1.5 py-0.5 rounded shrink-0">
                            modified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {isEnabled ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">$</span>
                            <input
                              type="number"
                              value={displayVal}
                              onChange={e => handleChange(f.key, e.target.value)}
                              className="w-28 text-right bg-gray-800 border border-yellow-700/50 text-white text-sm px-2 py-1 rounded focus:outline-none focus:border-yellow-500"
                            />
                          </div>
                        ) : (
                          <span className="text-sm font-mono text-white w-28 text-right">
                            ${fmtDollar(systemVal)}
                          </span>
                        )}
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <div
                            onClick={() => toggleOverride(f.key, systemVal)}
                            className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                              isEnabled ? "bg-yellow-600" : "bg-gray-700"
                            }`}
                          >
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                              isEnabled ? "translate-x-4" : "translate-x-0.5"
                            }`} />
                          </div>
                          <span className="text-xs text-gray-500">override</span>
                        </label>
                      </div>
                    </div>
                    {isEnabled && !isModified && (
                      <div className="mt-1 ml-13 pl-13">
                        <span className="text-xs text-gray-600 ml-13">
                          System: ${fmtDollar(systemVal)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-xs text-gray-500">
        Overrides are for manual review only. They do not affect the engine calculation or saved data until Task 8.1 sync is implemented.
      </div>
    </div>
  );
}
