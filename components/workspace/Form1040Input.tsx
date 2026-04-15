"use client";
// components/workspace/Form1040Input.tsx 
// Form 1040 — line-by-line view with inline editing + client-side live recalculation
// Uses lib/tax/calc.ts — single source of truth shared with PDF engine

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { quickCalculate } from "@/actions/fast-file";
import { calculate } from "@/lib/tax/calc";

type TaxYear = any;

function fmt(n: number) {
  if (!n && n !== 0) return "—";
  return "$" + Math.abs(n).toLocaleString("en-US");
}
function p(v: any) { return parseFloat(String(v ?? "0").replace(/,/g, "")) || 0; }
function unformat(v: string): string { return v.replace(/,/g, ""); }

// ── Editable line state ───────────────────────────────────────────────────────
type Overrides = {
  line1a?:  string;
  line8?:   string;
  line25a?: string;
  line25b?: string;
  line26?:  string;
};

export function Form1040Input({ taxYear }: { taxYear: TaxYear }) {
  const [isPending, startTransition] = useTransition();
  const [overrides, setOverrides]    = useState<Overrides>({});
  const [saved,     setSaved]        = useState<string | null>(null);

  const filingStatus = taxYear.filingStatus ?? "SINGLE";
  const scenarios    = taxYear.scenarios ?? [];
  const best         = scenarios.find((s: any) => s.type === "BALANCED")?.result ?? scenarios[0]?.result;
  const incomeItems  = taxYear.incomeItems  ?? [];
  const deps         = taxYear.dependents   ?? [];

  // Base values from engine (server-calculated)
  const standardDed   = p(best?.standardDeduction);
  const totalCredits  = p(best?.totalCredits);
  const engineNetProfit = p(best?.netProfit);

  // Income bases from items
  const w2Base   = incomeItems.filter((i: any) => i.type === "W2").reduce((s: number, i: any) => s + p(i.amount), 0);
  const n99Base  = incomeItems.filter((i: any) => i.type !== "W2").reduce((s: number, i: any) => s + p(i.amount), 0);
  const w2WBase  = incomeItems.filter((i: any) => i.type === "W2").reduce((s: number, i: any) => s + p(i.withholding), 0);
  const n99WBase = incomeItems.filter((i: any) => i.type !== "W2").reduce((s: number, i: any) => s + p(i.withholding), 0);

  // Apply overrides
  const line1a  = overrides.line1a  !== undefined ? p(overrides.line1a)  : w2Base;
  const line8v  = overrides.line8   !== undefined ? p(overrides.line8)   : engineNetProfit;
  const line25a = overrides.line25a !== undefined ? p(overrides.line25a) : w2WBase;
  const line25b = overrides.line25b !== undefined ? p(overrides.line25b) : n99WBase;
  const line26v = overrides.line26  !== undefined ? p(overrides.line26)  : 0;

  // ── CLIENT-SIDE LIVE RECALCULATION via shared engine ──────────────────────
  const calc = useMemo(() => {
    const numChildren = deps.length;
    return calculate({
      filingStatus,
      w2Income:           line1a,
      seNetProfit:        line8v,
      w2Withholding:      line25a,
      n99Withholding:     line25b,
      estimatedPayments:  line26v,
      numChildren,
      standardDedOverride: standardDed > 0 ? standardDed : undefined,
    });
  }, [line1a, line8v, line25a, line25b, line26v, standardDed, deps.length, filingStatus]);

  const hasOverrides = Object.values(overrides).some(v => v !== undefined && v !== "");

  // ── Flash highlight when tax/refund changes ───────────────────────────────
  const [flash, setFlash] = useState<"tax-up" | "tax-down" | "refund" | null>(null);
  const prevTax    = useRef(calc.line24);
  const prevRefund = useRef(calc.line34);
  const isFirst    = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (calc.line24 !== prevTax.current) {
      setFlash(calc.line24 > prevTax.current ? "tax-up" : "tax-down");
      prevTax.current = calc.line24;
      setTimeout(() => setFlash(null), 800);
    } else if (calc.line34 !== prevRefund.current && calc.line34 > 0) {
      setFlash("refund");
      prevRefund.current = calc.line34;
      setTimeout(() => setFlash(null), 800);
    }
  }, [calc.line24, calc.line34]);

  const update = (key: keyof Overrides, val: string) => {
    // Store raw digits, display formatted
    setOverrides(prev => ({ ...prev, [key]: unformat(val) }));
  };

  const handleApply = () => {
    startTransition(async () => {
      await quickCalculate(taxYear.id);
      setSaved("✓ Applied to engine");
      setTimeout(() => setSaved(null), 2500);
    });
  };

  const resetAll = () => setOverrides({});

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>

      {/* Flash animation */}
      <style>{`
        @keyframes flashRed   { 0%{background:rgba(239,68,68,0.18)}  100%{background:transparent} }
        @keyframes flashGreen { 0%{background:rgba(16,185,129,0.18)} 100%{background:transparent} }
        .flash-red   { animation: flashRed   0.7s ease-out }
        .flash-green { animation: flashGreen 0.7s ease-out }
      `}</style>

      {/* Header bar with live result */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, padding: "12px 16px",
        background: "var(--solar-surface)", borderRadius: 10,
        border: `1px solid ${hasOverrides ? "rgba(245,158,11,0.4)" : "var(--solar-border)"}`,
        transition: "border-color .2s",
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--solar-text)" }}>
            Form 1040 — Tax Year {taxYear.year}
            {hasOverrides && <span style={{ fontSize: 10, color: "var(--solar-sun)", marginLeft: 8 }}>● Live simulation</span>}
          </div>
          <div style={{ fontSize: 10, color: "var(--solar-muted)", marginTop: 2 }}>
            {filingStatus.replace(/_/g, " ")} · Edit any line → tax updates instantly
          </div>
        </div>

        {/* Live result summary */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "var(--solar-muted)", letterSpacing: .6 }}>EFFECTIVE RATE</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--solar-text)", fontFamily: "system-ui" }}>
              {calc.effectiveRate}%
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: "var(--solar-border)" }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "var(--solar-muted)", letterSpacing: .6 }}>TOTAL TAX</div>
            <div
              className={flash === "tax-up" ? "flash-red" : flash === "tax-down" ? "flash-green" : ""}
              style={{ fontSize: 16, fontWeight: 800, color: "var(--solar-red)", fontFamily: "system-ui", borderRadius: 6, padding: "2px 4px", transition: "background .1s" }}
            >
              {fmt(calc.line24)}
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: "var(--solar-border)" }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "var(--solar-muted)", letterSpacing: .6 }}>
              {calc.isRefund ? "REFUND" : "AMOUNT DUE"}
            </div>
            <div
              className={flash === "refund" ? "flash-green" : ""}
              style={{ fontSize: 16, fontWeight: 800, fontFamily: "system-ui", borderRadius: 6, padding: "2px 4px",
                color: calc.isRefund ? "var(--solar-green)" : "var(--solar-red)", transition: "background .1s" }}
            >
              {fmt(calc.isRefund ? calc.line34 : calc.line37)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {saved && <span style={{ fontSize: 10, color: "var(--solar-green)" }}>{saved}</span>}
            {isPending && <span style={{ fontSize: 10, color: "var(--solar-sun)" }}>⟳ Syncing...</span>}
            {hasOverrides && !isPending && !saved && (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={resetAll} style={{
                  padding: "5px 10px", borderRadius: 6,
                  border: "1px solid var(--solar-border)", background: "transparent",
                  color: "var(--solar-muted)", fontSize: 10, cursor: "pointer",
                }}>Reset</button>
                <a
                  href={`/api/report/${taxYear.id}?${
                    Object.entries(overrides)
                      .filter(([,v]) => v !== undefined && v !== "")
                      .map(([k,v]) => `${k}=${v}`)
                      .join("&")
                  }`}
                  download
                  style={{
                    padding: "5px 12px", borderRadius: 6,
                    border: "1px solid var(--solar-border)", background: "transparent",
                    color: "var(--solar-muted)", fontSize: 10, textDecoration: "none",
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}
                >📄 PDF</a>
                <button onClick={handleApply} style={{
                  padding: "5px 14px", borderRadius: 6, border: "none",
                  background: "var(--solar-sun)", color: "#000",
                  fontSize: 10, fontWeight: 700, cursor: "pointer",
                }}>⚡ Apply Changes</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PAGE 1 ──────────────────────────────────────────────────────── */}
      <FormSection label="Form 1040 · Page 1 — Income" color="#2563EB">

        <FormBlock label="Lines 1a–1z · Wages & Earned Income">
          <LineRow
            n="1a" label="W-2 wages, salaries, tips" base={w2Base}
            editable value={overrides.line1a ?? ""}
            onChange={v => update("line1a", v)}
            badge="KEY" note="From Form W-2, box 1"
          />
          <LineRow n="1z" label="Total earned income (add lines 1a–1h)" base={line1a} bold />
        </FormBlock>

        <FormBlock label="Lines 2–6 · Investment & Retirement (Phase 2)">
          <LineRow n="2b" label="Taxable interest" base={0} muted note="Schedule B — coming soon" />
          <LineRow n="3b" label="Ordinary dividends" base={0} muted note="Schedule B — coming soon" />
          <LineRow n="4b" label="IRA distributions — taxable" base={0} muted />
          <LineRow n="5b" label="Pensions and annuities — taxable" base={0} muted />
          <LineRow n="6b" label="Social security — taxable amount" base={0} muted />
        </FormBlock>

        <FormBlock label="Lines 7–9 · Business & Total Income">
          <LineRow n="7"  label="Capital gain or (loss) — Schedule D" base={0} muted note="Schedule D — coming soon" />
          <LineRow
            n="8" label="Additional income — Schedule 1 (self-employment net profit)" base={line8v}
            editable value={overrides.line8 ?? ""}
            onChange={v => update("line8", v)}
            badge="KEY" note="Net profit from Schedule C"
          />
          <LineRow n="9" label="TOTAL INCOME" base={calc.line9} bold accent />
        </FormBlock>

        <FormBlock label="Lines 10–11 · Adjustments → AGI">
          <LineRow n="10" label="Adjustments — deductible SE tax (50%)" base={calc.seDeductible} />
          <LineRow n="11" label="ADJUSTED GROSS INCOME" base={calc.line11} bold accent badge="KEY"
            note={calc.line11 > 0 && calc.line11 <= 84000 ? "✓ Qualifies for IRS Free File ($0 filing)" : calc.line11 > 84000 ? "AGI > $84,000 — standard filing applies" : ""} />
        </FormBlock>

        <FormBlock label="Lines 12–15 · Deductions & Taxable Income">
          <LineRow n="12" label={`Standard deduction (${taxYear.filingStatus === "MARRIED_FILING_JOINTLY" ? "MFJ $29,200" : "Single $14,600"})`}
            base={standardDed} />
          <LineRow n="13" label="QBI deduction — Form 8995 (20% of net SE profit)" base={calc.line13}
            note={calc.line13 > 0 ? `20% × $${Math.round(line8v).toLocaleString()} = $${Math.round(calc.line13).toLocaleString()}` : ""} />
          <LineRow n="14" label="Total deductions (line 12 + 13)" base={calc.line14} />
          <LineRow n="15" label="TAXABLE INCOME" base={calc.line15} bold accent badge="KEY" />
        </FormBlock>
      </FormSection>

      {/* ── PAGE 2 ──────────────────────────────────────────────────────── */}
      <FormSection label="Form 1040 · Page 2 — Tax, Credits & Payments" color="#7C3AED">

        <FormBlock label="Lines 16–24 · Tax & Credits">
          <LineRow n="16" label="Income tax from IRS tax brackets" base={calc.line16} />
          <LineRow n="17" label="Additional taxes — Schedule 2, line 3" base={0} muted />
          <LineRow n="18" label="Add lines 16 + 17" base={calc.line16} />
          <LineRow n="19" label="Child tax credit — Schedule 8812" base={calc.line19}
            note={deps.length > 0 ? `${deps.length} qualifying child${deps.length > 1 ? "ren" : ""} × $2,000` : ""} />
          <LineRow n="20" label="Other credits — Schedule 3" base={0} muted />
          <LineRow n="21" label="Total credits (19 + 20)" base={calc.line19} />
          <LineRow n="22" label="Tax after credits (18 − 21)" base={calc.line22} />
          <LineRow n="23" label="Self-employment tax — Schedule SE" base={calc.line23} />
          <LineRow n="24" label="TOTAL TAX" base={calc.line24} bold accent badge="KEY"
            color="var(--solar-red)" />
        </FormBlock>

        <FormBlock label="Lines 25–33 · Payments (editable)">
          <LineRow
            n="25a" label="W-2 federal income tax withheld" base={w2WBase}
            editable value={overrides.line25a ?? ""}
            onChange={v => update("line25a", v)}
            note="From Form W-2, box 2"
          />
          <LineRow
            n="25b" label="1099 federal income tax withheld" base={n99WBase}
            editable value={overrides.line25b ?? ""}
            onChange={v => update("line25b", v)}
            note="From Form 1099"
          />
          <LineRow n="25d" label="Total withholding (25a + 25b)" base={calc.line25d} bold />
          <LineRow
            n="26" label="Estimated tax payments (quarterly — Form 1040-ES)" base={0}
            editable value={overrides.line26 ?? ""}
            onChange={v => update("line26", v)}
            note="Enter if you paid quarterly estimated taxes"
          />
          <LineRow n="27" label="Earned income credit (EIC)" base={0} muted />
          <LineRow n="28" label="Additional child tax credit — Schedule 8812" base={0} muted />
          <LineRow n="33" label="TOTAL PAYMENTS" base={calc.line33} bold />
        </FormBlock>

        <FormBlock label="Lines 34–37 · Result">
          <div style={{
            borderRadius: 10, padding: "12px 14px", marginTop: 8,
            background: calc.isRefund ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${calc.isRefund ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
          }}>
            {calc.isRefund ? (
              <>
                <LineRow n="34"  label="Amount overpaid (line 33 − line 24)" base={calc.line34}  bold color="var(--solar-green)" />
                <LineRow n="35a" label="REFUND — amount to be refunded" base={calc.line34} bold accent badge="KEY" color="var(--solar-green)" />
              </>
            ) : (
              <LineRow n="37" label="AMOUNT YOU OWE (line 24 − line 33)" base={calc.line37} bold accent badge="KEY" color="var(--solar-red)" />
            )}
          </div>
        </FormBlock>
      </FormSection>

      {/* ── SCHEDULE SE ─────────────────────────────────────────────────── */}
      <FormSection label="Schedule SE — Self-Employment Tax" color="#D97706">
        <FormBlock label="">
          <LineRow n="2"  label="Net profit from Schedule C, line 31" base={line8v} />
          <LineRow n="4a" label="Net SE earnings × 92.35%" base={line8v * 0.9235} />
          <LineRow n="4c" label="SE tax rate × 15.3% (or 2.9% above SS wage base)" base={calc.line23} />
          <LineRow n="6"  label="Deductible SE tax (50%) → Schedule 1, line 15" base={calc.seDeductible} bold
            note="Reduces AGI" />
          <LineRow n="SE" label="SE TAX → Schedule 2, line 4 / 1040 line 23" base={calc.line23} bold accent
            color="var(--solar-red)" />
        </FormBlock>
      </FormSection>

      {/* ── INCOME SOURCES ──────────────────────────────────────────────── */}
      <FormSection label="Income Sources (→ Schedule C + 1040 lines 1a / 8)" color="#059669">
        <div style={{ padding: "8px 0" }}>
          {incomeItems.length === 0 ? (
            <div style={{ color: "var(--solar-muted)", fontSize: 11, padding: "8px 0" }}>
              No income — add via the Inputs tab above
            </div>
          ) : incomeItems.map((item: any) => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 0", borderBottom: "1px solid var(--solar-border)",
            }}>
              <span style={{ fontSize: 9, color: "var(--solar-muted)", minWidth: 24, textAlign: "right" }}>
                {item.type === "W2" ? "1a" : "8"}
              </span>
              <span style={{ flex: 1, color: "var(--solar-text)" }}>{item.source}</span>
              <span style={{
                fontSize: 9, padding: "1px 6px", borderRadius: 4,
                background: item.type === "W2" ? "rgba(37,99,235,0.12)" : "rgba(5,150,105,0.12)",
                color:      item.type === "W2" ? "#2563EB" : "#059669",
              }}>{item.type}</span>
              <span style={{ fontWeight: 600, color: "var(--solar-green)", minWidth: 80, textAlign: "right" }}>
                {fmt(p(item.amount))}
              </span>
              <span style={{ color: "var(--solar-muted)", fontSize: 10, minWidth: 72, textAlign: "right" }}>
                W/H {fmt(p(item.withholding))}
              </span>
            </div>
          ))}
        </div>
      </FormSection>

      {/* ── DEPENDENTS ──────────────────────────────────────────────────── */}
      {deps.length > 0 && (
        <FormSection label="Dependents — Schedule 8812 · Child Tax Credit" color="#7C3AED">
          <div style={{ padding: "8px 0" }}>
            {deps.map((d: any) => (
              <div key={d.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "5px 0", borderBottom: "1px solid var(--solar-border)", fontSize: 11,
              }}>
                <span style={{ flex: 1, fontWeight: 600, color: "var(--solar-text)" }}>
                  {d.firstName} {d.lastName}
                </span>
                <span style={{ color: "var(--solar-muted)" }}>{d.relationship}</span>
                <span style={{ color: "#7C3AED", fontWeight: 700 }}>$2,000</span>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 11, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--solar-muted)" }}>Total Child Tax Credit (line 19)</span>
              <span style={{ fontWeight: 700, color: "#7C3AED" }}>{fmt(totalCredits)}</span>
            </div>
          </div>
        </FormSection>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FormSection({ label, color, children }: {
  label: string; color: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      borderRadius: 12, border: "1px solid var(--solar-border)",
      background: "var(--solar-surface)", overflow: "hidden", marginBottom: 16,
    }}>
      <div style={{
        padding: "9px 16px",
        background: `${color}10`,
        borderBottom: "1px solid var(--solar-border)",
        borderLeft: `3px solid ${color}`,
        fontSize: 9, fontWeight: 700, color, letterSpacing: .8, textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{ padding: "0 16px 10px" }}>{children}</div>
    </div>
  );
}

function FormBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 10, marginBottom: 4 }}>
      {label && (
        <div style={{
          fontSize: 9, color: "var(--solar-muted)", letterSpacing: .5,
          marginBottom: 4, textTransform: "uppercase", paddingTop: 4,
          borderTop: "1px solid var(--solar-border)",
        }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function LineRow({
  n, label, base, bold, accent, color, muted, note, badge,
  editable, value, onChange,
}: {
  n:         string;
  label:     string;
  base:      number;
  bold?:     boolean;
  accent?:   boolean;
  color?:    string;
  muted?:    boolean;
  note?:     string;
  badge?:    string;
  editable?: boolean;
  value?:    string;
  onChange?: (v: string) => void;
}) {
  const isOverridden = editable && value !== undefined && value !== "";
  const displayVal   = isOverridden ? (parseFloat(value!) || 0) : base;
  const textColor    = muted ? "var(--solar-muted)" : color ?? "var(--solar-text)";
  const valColor     = muted ? "var(--solar-muted)" : color ?? (accent ? "var(--solar-sun)" : "var(--solar-text)");

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: accent ? "8px 0" : "5px 0",
      borderBottom: "1px solid var(--solar-border)",
      background: isOverridden ? "rgba(245,158,11,0.03)" : "transparent",
    }}>
      {/* Line number */}
      <div style={{
        fontSize: 9, fontWeight: 700,
        color: muted ? "var(--solar-border)" : "var(--solar-muted)",
        minWidth: 28, textAlign: "right", flexShrink: 0,
      }}>
        {n}
      </div>

      {/* Label + note */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: bold ? 11 : 10,
          fontWeight: bold ? 600 : 400,
          color: textColor,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {label}
          {badge && (
            <span style={{
              fontSize: 8, padding: "1px 5px", borderRadius: 3,
              background: "rgba(245,158,11,0.15)",
              color: "var(--solar-sun)", fontWeight: 700,
            }}>{badge}</span>
          )}
          {isOverridden && (
            <span style={{ fontSize: 8, color: "var(--solar-sun)", opacity: .7 }}>edited</span>
          )}
        </div>
        {note && (
          <div style={{ fontSize: 9, color: "var(--solar-green)", marginTop: 1 }}>{note}</div>
        )}
      </div>

      {/* Editable input OR display value */}
      {editable ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: "var(--solar-muted)" }}>$</span>
          <input
            type="text"
            inputMode="numeric"
            value={value ? parseInt(value.replace(/,/g, "") || "0", 10).toLocaleString("en-US") : ""}
            onChange={e => {
              const raw = e.target.value.replace(/,/g, "").replace(/\D/g, "");
              onChange?.(raw);
            }}
            placeholder={Math.round(base).toLocaleString("en-US")}
            style={{
              width: 110, padding: "4px 8px", borderRadius: 6,
              border: `1px solid ${isOverridden ? "var(--solar-sun)" : "var(--solar-border)"}`,
              background: "var(--solar-bg)", color: "var(--solar-text)",
              fontSize: 11, textAlign: "right", outline: "none",
              fontFamily: "inherit",
            }}
          />
          {isOverridden && (
            <button
              onClick={() => onChange?.("")}
              title="Reset to engine value"
              style={{
                fontSize: 10, color: "var(--solar-muted)", background: "none",
                border: "none", cursor: "pointer", padding: 0, lineHeight: 1,
              }}
            >✕</button>
          )}
        </div>
      ) : (
        <div style={{
          fontSize:   accent ? 14 : bold ? 12 : 11,
          fontWeight: bold ? 700 : 400,
          color:      valColor,
          minWidth:   90, textAlign: "right", flexShrink: 0,
          fontFamily: "system-ui",
        }}>
          {displayVal ? `$${Math.abs(displayVal).toLocaleString("en-US")}` : <span style={{ color: "var(--solar-border)" }}>—</span>}
        </div>
      )}
    </div>
  );
}
