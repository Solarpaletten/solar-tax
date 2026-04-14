// components/irs/Form1040Editor.tsx
"use client";

import { useState } from "react";
import { fmtDollar } from "@/lib/reporting/format";
import type { IRS1040Report } from "@/lib/reporting/types";

// ── Text fields (names, address) ──────────────────────────────────────────
type TextField = { key: string; label: string };

const TEXT_FIELDS: TextField[] = [
  { key: "taxpayerName", label: "Taxpayer Name" },
  { key: "spouseName", label: "Spouse Name" },
  { key: "filingStatus", label: "Filing Status" },
  { key: "address", label: "Address" },
];

// ── Numeric fields (1040 lines) ───────────────────────────────────────────
type NumField = { key: keyof IRS1040Report; label: string; line: string; section: string };

const NUM_FIELDS: NumField[] = [
  { key: "line1a", line: "1a", label: "W-2 Wages", section: "income" },
  { key: "line8", line: "8", label: "Additional Income (Schedule 1)", section: "income" },
  { key: "line9", line: "9", label: "Total Income", section: "income" },
  { key: "line10", line: "10", label: "Adjustments to Income", section: "income" },
  { key: "line11", line: "11", label: "Adjusted Gross Income (AGI)", section: "income" },
  { key: "line12", line: "12", label: "Standard Deduction", section: "deductions" },
  { key: "line15", line: "15", label: "Taxable Income", section: "deductions" },
  { key: "line16", line: "16", label: "Income Tax", section: "tax" },
  { key: "line19", line: "19", label: "Child Tax Credit", section: "tax" },
  { key: "line23", line: "23", label: "Self-Employment Tax", section: "tax" },
  { key: "line24", line: "24", label: "Total Tax", section: "tax" },
  { key: "line25d", line: "25d", label: "Total Withholding", section: "payments" },
  { key: "line33", line: "33", label: "Total Payments", section: "payments" },
  { key: "line35a", line: "35a", label: "Refund", section: "payments" },
  { key: "line37", line: "37", label: "Amount You Owe", section: "payments" },
];

const SECTIONS = [
  { key: "income", label: "Income", color: "text-blue-400" },
  { key: "deductions", label: "Deductions", color: "text-purple-400" },
  { key: "tax", label: "Tax & Credits", color: "text-red-400" },
  { key: "payments", label: "Payments & Refund", color: "text-green-400" },
];

type Props = { report: IRS1040Report };

export default function Form1040Editor({ report }: Props) {
  // text overrides
  const [textVals, setTextVals] = useState<Record<string, string>>({});
  const [textOn, setTextOn] = useState<Record<string, boolean>>({});
  // numeric overrides
  const [numVals, setNumVals] = useState<Record<string, string>>({});
  const [numOn, setNumOn] = useState<Record<string, boolean>>({});

  const toggleText = (key: string, sys: string) => {
    setTextOn(p => {
      const next = { ...p, [key]: !p[key] };
      if (next[key] && !textVals[key]) setTextVals(v => ({ ...v, [key]: sys }));
      return next;
    });
  };
  const toggleNum = (key: string, sys: string) => {
    setNumOn(p => {
      const next = { ...p, [key]: !p[key] };
      if (next[key] && !numVals[key]) setNumVals(v => ({ ...v, [key]: sys }));
      return next;
    });
  };

  const overrideCount = Object.values(textOn).filter(Boolean).length +
    Object.values(numOn).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Form 1040 — Manual Override</h2>
          <p className="text-sm text-gray-400 mt-0.5">System values from engine. Toggle to edit.</p>
        </div>
        {overrideCount > 0 && (
          <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-lg px-3 py-1.5">
            <span className="text-xs text-yellow-300">{overrideCount} override{overrideCount > 1 ? "s" : ""} active</span>
          </div>
        )}
      </div>

      {/* ── Taxpayer Info ── */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">Taxpayer Info</span>
        </div>
        <div className="divide-y divide-gray-800">
          {TEXT_FIELDS.map(f => {
            const sys = (report as any)[f.key] ?? "";
            const on = textOn[f.key] ?? false;
            const val = on ? (textVals[f.key] ?? sys) : sys;
            const modified = on && textVals[f.key] !== sys;
            return (
              <div key={f.key} className={`px-5 py-3 ${on ? "bg-yellow-950/20" : ""}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-gray-300 truncate">{f.label}</span>
                    {modified && (
                      <span className="text-xs bg-yellow-800/50 text-yellow-300 px-1.5 py-0.5 rounded shrink-0">modified</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {on ? (
                      <input
                        type="text"
                        value={val}
                        onChange={e => setTextVals(v => ({ ...v, [f.key]: e.target.value }))}
                        className="w-52 text-right bg-gray-800 border border-yellow-700/50 text-white text-sm px-2 py-1 rounded focus:outline-none focus:border-yellow-500"
                      />
                    ) : (
                      <span className="text-sm text-white w-52 text-right truncate">{val || "—"}</span>
                    )}
                    <Toggle on={on} onToggle={() => toggleText(f.key, sys)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Numeric sections ── */}
      {SECTIONS.map(sec => (
        <div key={sec.key} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <span className={`text-xs font-bold uppercase tracking-wider ${sec.color}`}>{sec.label}</span>
          </div>
          <div className="divide-y divide-gray-800">
            {NUM_FIELDS.filter(f => f.section === sec.key).map(f => {
              const sys = (report[f.key] as string) ?? "0";
              const on = numOn[f.key] ?? false;
              const val = on ? (numVals[f.key] ?? sys) : sys;
              const modified = on && numVals[f.key] !== sys;
              return (
                <div key={f.key} className={`px-5 py-3 ${on ? "bg-yellow-950/20" : ""}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-blue-400 w-10 shrink-0">{f.line}</span>
                      <span className="text-sm text-gray-300 truncate">{f.label}</span>
                      {modified && (
                        <span className="text-xs bg-yellow-800/50 text-yellow-300 px-1.5 py-0.5 rounded shrink-0">modified</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {on ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">$</span>
                          <input
                            type="number"
                            value={val}
                            onChange={e => setNumVals(v => ({ ...v, [f.key]: e.target.value }))}
                            className="w-28 text-right bg-gray-800 border border-yellow-700/50 text-white text-sm px-2 py-1 rounded focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                      ) : (
                        <span className="text-sm font-mono text-white w-28 text-right">${fmtDollar(sys)}</span>
                      )}
                      <Toggle on={on} onToggle={() => toggleNum(f.key, sys)} />
                    </div>
                  </div>
                  {on && !modified && (
                    <p className="text-xs text-gray-600 mt-1 pl-13">System: ${fmtDollar(sys)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-xs text-gray-500">
        Overrides are for manual review only — Task 8.1 will add autosave to database.
      </div>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer" onClick={onToggle}>
      <div className={`w-8 h-4 rounded-full transition-colors relative ${on ? "bg-yellow-600" : "bg-gray-700"}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
      <span className="text-xs text-gray-500">override</span>
    </label>
  );
}