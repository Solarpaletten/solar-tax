"use client";
// components/irs/Form1040Input.tsx
// Income input layer — maps directly to IRS Form 1040 lines

import { useState, useCallback } from "react";

export interface Income1040 {
  w2:        number;
  business:  number;
  interest:  number;
  dividends: number;
  other:     number;
}

interface Props {
  initial?: Partial<Income1040>;
  onChange: (data: Income1040) => void;
}

const LINES = [
  { key: "w2",        label: "W-2 Wages",          line: "Line 1a",       hint: "Box 1 of your W-2"            },
  { key: "business",  label: "Business / 1099-NEC", line: "Line 8 / Sch C", hint: "Net profit after expenses"  },
  { key: "interest",  label: "Taxable Interest",    line: "Line 2b",       hint: "From 1099-INT"                },
  { key: "dividends", label: "Ordinary Dividends",  line: "Line 3b",       hint: "From 1099-DIV"                },
  { key: "other",     label: "Other Income",        line: "Line 8z",       hint: "Prizes, alimony, misc"        },
] as const;

function toNum(s: string) {
  const n = parseFloat(s.replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmtDisplay(s: string) {
  if (!s) return "";
  const n = parseFloat(s.replace(/,/g, ""));
  if (isNaN(n)) return s;
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function Form1040Input({ initial, onChange }: Props) {
  const [raw, setRaw] = useState<Record<string, string>>({
    w2:        String(initial?.w2        ?? ""),
    business:  String(initial?.business  ?? ""),
    interest:  String(initial?.interest  ?? ""),
    dividends: String(initial?.dividends ?? ""),
    other:     String(initial?.other     ?? ""),
  });

  const totalIncome = LINES.reduce((sum, l) => sum + toNum(raw[l.key]), 0);

  const update = useCallback((key: string, value: string) => {
    const clean = value.replace(/[^\d.]/g, "");
    const next  = { ...raw, [key]: clean };
    setRaw(next);
    onChange({
      w2:        toNum(next.w2),
      business:  toNum(next.business),
      interest:  toNum(next.interest),
      dividends: toNum(next.dividends),
      other:     toNum(next.other),
    });
  }, [raw, onChange]);

  return (
    <div style={{
      borderRadius: 14, border: "1px solid var(--solar-border)",
      background: "var(--solar-surface)", overflow: "hidden",
    }}>
      <div style={{ height: 2, background: "linear-gradient(90deg, var(--solar-sun), var(--solar-sun-deep))" }} />
      <div style={{ padding: "16px 20px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--solar-muted)", letterSpacing: 1, textTransform: "uppercase" }}>
            Income — Form 1040
          </p>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
            background: "rgba(245,158,11,0.1)", color: "var(--solar-sun)",
          }}>
            AUTO-MAPPED TO IRS LINES
          </span>
        </div>
        <p style={{ fontSize: 11, color: "var(--solar-muted)", marginBottom: 16, lineHeight: 1.5 }}>
          💡 Enter your income — Solar maps it automatically to IRS Form 1040
        </p>
      </div>

      <div style={{ padding: "0 20px 20px" }}>
        {LINES.map(({ key, label, line, hint }) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--solar-text)" }}>{label}</label>
              <span style={{ fontSize: 10, color: "var(--solar-sun)", fontWeight: 600 }}>{line}</span>
            </div>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: 13, color: "var(--solar-muted)", pointerEvents: "none",
              }}>$</span>
              <input
                type="text"
                inputMode="decimal"
                value={fmtDisplay(raw[key])}
                onChange={e => update(key, e.target.value)}
                placeholder="0"
                style={{
                  width: "100%", padding: "10px 12px 10px 24px", borderRadius: 8,
                  border: `1px solid ${toNum(raw[key]) > 0 ? "var(--solar-green)" : "var(--solar-border)"}`,
                  background: "var(--solar-bg)", color: "var(--solar-text)",
                  fontSize: 14, fontWeight: 600, outline: "none", transition: "border-color .2s",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <p style={{ fontSize: 10, color: "var(--solar-muted)", marginTop: 3 }}>{hint}</p>
          </div>
        ))}

        {/* Total */}
        <div style={{
          marginTop: 16, padding: "12px 16px", borderRadius: 10,
          background: "var(--solar-bg)", border: "1px solid var(--solar-border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--solar-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Total Income (Line 9)
            </p>
            <p style={{ fontSize: 10, color: "var(--solar-muted)", marginTop: 2 }}>
              Before adjustments → feeds AGI (Line 11)
            </p>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: totalIncome > 0 ? "var(--solar-text)" : "var(--solar-muted)" }}>
            ${totalIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </div>
  );
}
