"use client";
// components/irs/Form1040View.tsx
// Read-only 1040 + 8879 view — all values auto-calculated
// Every line shows: value + source (from which form, which line, formula) s

import { useMemo, useState } from "react";
import { calculate } from "@/lib/tax/calc";
import type { TaxResult, LineSource } from "@/lib/tax/calc";

interface Props {
  taxYear: any;  // full taxYear with incomeItems, expenseItems, scenarios, dependents
  mode?: "1040" | "8879" | "both";
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

// ── Source badge ──────────────────────────────────────────────────────────────
function SourceBadge({ source, expanded }: { source: LineSource; expanded: boolean }) {
  if (!expanded) return null;
  return (
    <div style={{
      gridColumn: "1 / -1",
      marginTop: 2, marginBottom: 4,
      padding: "6px 10px",
      borderRadius: 6,
      background: "rgba(245,166,35,0.06)",
      border: "1px solid rgba(245,166,35,0.15)",
    }}>
      <div style={{ fontSize: 10, color: "#f5a623", fontWeight: 700, marginBottom: 2 }}>
        📎 {source.from}
      </div>
      <div style={{ fontSize: 10, color: "#999", fontFamily: "monospace" }}>
        = {source.formula}
      </div>
      {source.detail && (
        <div style={{ fontSize: 9, color: "#666", marginTop: 3 }}>{source.detail}</div>
      )}
    </div>
  );
}

// ── Single line row ───────────────────────────────────────────────────────────
function LineRow({
  lineNum, label, value, source, isTotal, isRefund, isOwed, indent = false,
}: {
  lineNum: string; label: string; value: number;
  source?: LineSource; isTotal?: boolean; isRefund?: boolean; isOwed?: boolean; indent?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const color = isRefund ? "#4ade80" : isOwed ? "#f87171" : isTotal ? "#f0f0f0" : "#ccc";

  return (
    <>
      <div
        onClick={() => source && setOpen(!open)}
        style={{
          display: "grid",
          gridTemplateColumns: source ? "32px 1fr auto 20px" : "32px 1fr auto",
          alignItems: "center",
          gap: 8,
          padding: indent ? "7px 16px 7px 32px" : "7px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          cursor: source ? "pointer" : "default",
          background: isTotal ? "rgba(255,255,255,0.03)" : "transparent",
          transition: "background .15s",
        }}
        onMouseEnter={e => source && (e.currentTarget.style.background = "rgba(245,166,35,0.04)")}
        onMouseLeave={e => (e.currentTarget.style.background = isTotal ? "rgba(255,255,255,0.03)" : "transparent")}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: "#f5a623", opacity: 0.7 }}>
          {lineNum}
        </span>
        <span style={{ fontSize: isTotal ? 12 : 11, color: "#888", fontWeight: isTotal ? 600 : 400 }}>
          {label}
        </span>
        <span style={{
          fontSize: isTotal ? 14 : 12,
          fontWeight: isTotal ? 800 : 600,
          color,
          fontFamily: "monospace",
          minWidth: 80,
          textAlign: "right",
        }}>
          {value === 0 && !isTotal ? "—" : `$${fmt(value)}`}
        </span>
        {source && (
          <span style={{ fontSize: 10, color: open ? "#f5a623" : "#444", transition: "color .15s" }}>
            {open ? "▲" : "▼"}
          </span>
        )}
      </div>
      {open && source && (
        <div style={{ padding: "6px 16px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <SourceBadge source={source} expanded />
        </div>
      )}
    </>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHead({ label }: { label: string }) {
  return (
    <div style={{
      padding: "8px 16px",
      background: "rgba(7,24,56,0.6)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      fontSize: 9, fontWeight: 700, color: "#5588cc",
      letterSpacing: 1, textTransform: "uppercase",
    }}>
      {label}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function Form1040View({ taxYear, mode = "both" }: Props) {
  const calc = useMemo<TaxResult | null>(() => {
    if (!taxYear) return null;

    const items     = taxYear.incomeItems  ?? [];
    const expenses  = taxYear.expenseItems ?? [];
    const deps      = taxYear.dependents   ?? [];

    // W-2
    const w2Items   = items.filter((i: any) => i.type === "W2");
    const w2Income  = w2Items.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const w2Wh      = w2Items.reduce((s: number, i: any) => s + Number(i.withholding), 0);
    const n99Wh     = items
      .filter((i: any) => !["W2"].includes(i.type))
      .reduce((s: number, i: any) => s + Number(i.withholding), 0);

    // Capital gains (CAPITAL_GAIN type or existing lineCapGain field)
    const capGainItems = items.filter((i: any) =>
      ["CAPITAL_GAIN", "FORM_1099_B"].includes(i.type)
    );
    const capitalGains = capGainItems.reduce((s: number, i: any) => s + Number(i.amount), 0);

    // SE income — group by taxpayer via 'source' field
    // Primary = any non-W2, non-cap-gain income tagged "primary" or first
    const seItems = items.filter((i: any) =>
      !["W2", "CAPITAL_GAIN", "FORM_1099_B"].includes(i.type)
    );

    // Allowed expenses per source tag (primary / spouse) or split 50/50 if untagged
    const primaryExpenses = expenses.filter((e: any) =>
      !e.notes?.toLowerCase().includes("spouse") && !e.notes?.toLowerCase().includes("wife")
    );
    const spouseExpenses = expenses.filter((e: any) =>
      e.notes?.toLowerCase().includes("spouse") || e.notes?.toLowerCase().includes("wife")
    );

    const allowedPrimary = primaryExpenses.reduce(
      (s: number, e: any) => s + Number(e.amount) * (e.businessPct / 100), 0
    );
    const allowedSpouse = spouseExpenses.reduce(
      (s: number, e: any) => s + Number(e.amount) * (e.businessPct / 100), 0
    );

    // SE gross per taxpayer
    const primarySE = seItems.filter((i: any) =>
      !i.source?.toLowerCase().includes("spouse") && !i.source?.toLowerCase().includes("wife")
    );
    const spouseSE = seItems.filter((i: any) =>
      i.source?.toLowerCase().includes("spouse") || i.source?.toLowerCase().includes("wife")
    );

    const primaryGross = primarySE.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const spouseGross  = spouseSE.reduce((s: number, i: any)  => s + Number(i.amount), 0);

    // If we can't split, use totals from BALANCED scenario as fallback
    const balanced = taxYear.scenarios?.find((s: any) => s.type === "BALANCED")?.result;

    const scheduleC = spouseGross > 0 ? [
      { name: "Primary",  grossRevenue: primaryGross, allowedExpenses: allowedPrimary },
      { name: "Spouse",   grossRevenue: spouseGross,  allowedExpenses: allowedSpouse  },
    ] : [
      { name: "Primary",  grossRevenue: primaryGross || Number(balanced?.netProfit ?? 0),
        allowedExpenses: allowedPrimary },
    ];

    const numChildren = deps.filter((d: any) => {
      const age = new Date().getFullYear() - new Date(d.dateOfBirth).getFullYear();
      return age < 17 && d.months >= 6;
    }).length;

    return calculate({
      filingStatus:      taxYear.filingStatus ?? "MARRIED_FILING_JOINTLY",
      w2Income,
      scheduleC,
      w2Withholding:     w2Wh,
      n99Withholding:    n99Wh,
      estimatedPayments: 0,
      numChildren,
      capitalGains,
    });
  }, [taxYear]);

  if (!calc) {
    return <div style={{ padding: 24, color: "#666", fontSize: 13 }}>No data available</div>;
  }

  const sm = calc.sourceMap;

  const card = {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    background: "#0d0d14",
  };

  const cardHead = (title: string, sub: string, icon: string) => (
    <div style={{
      padding: "10px 16px",
      background: "rgba(7,24,56,0.8)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{icon} {title}</div>
        <div style={{ fontSize: 9, color: "#5588cc", marginTop: 2, letterSpacing: 0.5 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 9, color: "#444", padding: "3px 10px", border: "1px solid #222", borderRadius: 10 }}>
        Read-only · Click line for source
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#f0f0f0" }}>

      {/* ── Schedule C Summary ──────────────────────────────────── */}
      {(mode === "1040" || mode === "both") && (
        <div style={card}>
          {cardHead("Schedule C", "Profit or Loss from Business", "📊")}
          <SectionHead label="Per-Taxpayer Net Profit (→ Schedule 1 line 3)" />
          {calc.scheduleC.map((c, i) => (
            <LineRow
              key={i}
              lineNum={`C${i + 1}`}
              label={`${c.name} — Net profit (gross $${fmt(c.grossRevenue)} − exp $${fmt(c.allowedExpenses)})`}
              value={c.netProfit ?? 0}
              source={sm["schC"]}
            />
          ))}
          <LineRow
            lineNum="Σ"
            label="Total Schedule C → Schedule 1 line 3 → 1040 line 8"
            value={calc.schC_total}
            source={sm["sch1_line3"]}
            isTotal
          />
        </div>
      )}

      {/* ── Schedule SE Summary ─────────────────────────────────── */}
      {(mode === "1040" || mode === "both") && (
        <div style={card}>
          {cardHead("Schedule SE", "Self-Employment Tax", "💼")}
          <SectionHead label="SE Tax per Taxpayer (15.3% × 92.35% × net profit)" />
          {calc.scheduleC.map((c, i) => {
            const tax  = i === 0 ? calc.seTax_primary : calc.seTax_spouse;
            const half = i === 0 ? calc.seHalf_primary : calc.seHalf_spouse;
            return (
              <div key={i}>
                <LineRow lineNum={`SE${i+1}`} label={`${c.name} — SE tax (line 12)`}
                  value={tax} source={sm["schSE_line12"]} />
                <LineRow lineNum={`SE${i+1}`} label={`${c.name} — Deductible half (line 13 → Sch1 line 15)`}
                  value={half} source={sm["schSE_line13"]} indent />
              </div>
            );
          })}
          <LineRow lineNum="2/4" label="Total SE tax → Schedule 2 line 21 → 1040 line 23"
            value={calc.seTax} source={sm["schSE_line12"]} isTotal />
          <LineRow lineNum="1/26" label="Total SE deduction → Schedule 1 line 26 → 1040 line 10"
            value={calc.seDeductible} source={sm["sch1_line26"]} isTotal />
        </div>
      )}

      {/* ── Form 1040 ───────────────────────────────────────────── */}
      {(mode === "1040" || mode === "both") && (
        <div style={card}>
          {cardHead("Form 1040", `U.S. Individual Income Tax Return · ${taxYear.year}`, "🇺🇸")}

          <SectionHead label="Page 1 — Income" />
          <LineRow lineNum="1a" label="W-2 wages, salaries, tips" value={calc.line1a} source={sm["1040_line1a"]} />
          <LineRow lineNum="7"  label="Capital gain or (loss) — Schedule D" value={calc.line7} source={sm["1040_line7"]} />
          <LineRow lineNum="8"  label="Additional income — Schedule 1 line 10" value={calc.line8} source={sm["1040_line8"]} />
          <LineRow lineNum="9"  label="Total income" value={calc.line9} source={sm["1040_line9"]} isTotal />

          <SectionHead label="Adjustments to Income" />
          <LineRow lineNum="10" label="Deductible SE tax — Schedule 1 line 26" value={calc.line10} source={sm["1040_line10"]} />
          <LineRow lineNum="11" label="Adjusted Gross Income (AGI)" value={calc.line11} source={sm["1040_line11"]} isTotal />

          <SectionHead label="Page 2 — Tax and Credits" />
          <LineRow lineNum="12" label="Standard deduction" value={calc.line12} source={sm["1040_line12"]} />
          <LineRow lineNum="13" label="QBI deduction — Form 8995" value={calc.line13} source={sm["1040_line13"]} indent />
          <LineRow lineNum="15" label="Taxable income" value={calc.line15} source={sm["1040_line15"]} isTotal />
          <LineRow lineNum="16" label="Tax (from tax brackets)" value={calc.line16} source={sm["1040_line16"]} />
          <LineRow lineNum="19" label="Child tax credit" value={calc.line19} source={sm["1040_line19"]} indent />
          <LineRow lineNum="22" label="Tax after credits" value={calc.line22} source={sm["1040_line22"]} />
          <LineRow lineNum="23" label="Self-employment tax — Schedule 2 line 21" value={calc.line23} source={sm["1040_line23"]} />
          <LineRow lineNum="24" label="Total tax" value={calc.line24} source={sm["1040_line24"]} isTotal />

          <SectionHead label="Payments" />
          <LineRow lineNum="25d" label="Total withholding (W-2 + 1099)" value={calc.line25d} source={sm["1040_line25d"]} />
          <LineRow lineNum="26"  label="Estimated tax payments" value={calc.line26} />
          <LineRow lineNum="33"  label="Total payments" value={calc.line33} source={sm["1040_line33"]} isTotal />

          <SectionHead label="Refund or Amount Owed" />
          {calc.isRefund ? (
            <LineRow lineNum="34" label="Amount overpaid — REFUND" value={calc.line34}
              source={sm["1040_line34"]} isTotal isRefund />
          ) : (
            <LineRow lineNum="37" label="Amount you owe" value={calc.line37}
              source={sm["1040_line37"]} isTotal isOwed />
          )}

          {/* Effective rate footer */}
          <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ color: "#555" }}>Effective tax rate</span>
            <span style={{ fontWeight: 700, color: "#f5a623" }}>{calc.effectiveRate.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* ── Form 8879 ───────────────────────────────────────────── */}
      {(mode === "8879" || mode === "both") && (
        <div style={card}>
          {cardHead("Form 8879", "IRS e-file Signature Authorization · ERO: TLNC TRADE LLC", "🔐")}
          <SectionHead label="Part I — Tax Return Information (auto-filled from 1040)" />
          <LineRow lineNum="1" label="Adjusted gross income (= 1040 line 11)" value={calc.line11} source={sm["8879_line1"]} isTotal />
          <LineRow lineNum="2" label="Total tax (= 1040 line 24)"              value={calc.line24} source={sm["8879_line2"]} />
          <LineRow lineNum="3" label="Federal tax withheld (= 1040 line 25d)"  value={calc.line25d} source={sm["8879_line3"]} />
          <LineRow lineNum="4" label="Refund (= 1040 line 34)"                 value={calc.line34} source={sm["8879_line4"]} isRefund={calc.isRefund} />
          <LineRow lineNum="5" label="Amount you owe (= 1040 line 37)"         value={calc.line37} source={sm["8879_line5"]} isOwed={!calc.isRefund} />
          <div style={{ padding: "8px 16px", background: "rgba(7,24,56,0.4)", fontSize: 10, color: "#5588cc" }}>
            🔒 All values auto-calculated from Schedule C / SE / D · No manual input
          </div>
        </div>
      )}
    </div>
  );
}
