// components/fast-file/FastFilingPage.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { importPreviousYear, quickCalculate } from "@/actions/fast-file";

// ── Solar Design tokens ──────────────────────────────────────────────────────
const S = {
  bg: "#0B1220",
  surface: "#111827",
  card: "#151F2E",
  sun: "#F59E0B",
  sunDeep: "#D97706",
  sunGlow: "#FCD34D",
  green: "#10B981",
  red: "#EF4444",
  blue: "#3B82F6",
  text: "#F9FAFB",
  muted: "#6B7280",
  border: "#1F2937",
};

type TaxYear = any;

export function FastFilingPage({ taxYear }: { taxYear: TaxYear }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "imported" | "calculated" | "submitted">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const household = taxYear.household;
  const incomeItems = taxYear.incomeItems ?? [];
  const expenseItems = taxYear.expenseItems ?? [];
  const dependents = taxYear.dependents ?? [];
  const scenarios = taxYear.scenarios ?? [];

  const bestResult = scenarios.find((s: any) => s.type === "BALANCED")?.result
    ?? scenarios[0]?.result;

  const totalIncome = incomeItems.reduce((s: number, i: any) => s + parseFloat(i.amount || "0"), 0);
  const totalExpenses = expenseItems.reduce((s: number, e: any) => s + parseFloat(e.amount || "0"), 0);
  const totalTax = parseFloat(bestResult?.taxOwed ?? "0");
  const amountDue = Math.max(0, totalTax - parseFloat(bestResult?.totalWithholding ?? "0"));

  function fmt(n: number) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  const handleImport = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await importPreviousYear(taxYear.id);
      if ((res as any).error) {
        setError((res as any).error);
      } else {
        setStatus("imported");
        setMessage(`✓ Imported data from ${(res as any).year} — amounts carried over`);
      }
    });
  };

  const handleCalculate = () => {
    setError(null);
    startTransition(async () => {
      await quickCalculate(taxYear.id);
      setStatus("calculated");
      setMessage("✓ Calculation complete");
    });
  };

  const handleSubmit = () => {
    setStatus("submitted");
    setMessage("✓ Return exported — ready to file");
  };

  const downloadUrl = `/api/report/${taxYear.id}`;

  return (
    <div style={{ background: S.bg, minHeight: "100vh", fontFamily: "'JetBrains Mono', monospace", color: S.text }}>
      {/* Sun rays background */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 60%)",
      }} />

      <div style={{ position: "relative", maxWidth: 1040, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* ── HEADER ── */}
        <header style={{ padding: "24px 0 20px", borderBottom: `1px solid ${S.border}`, marginBottom: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Sun icon */}
            <div style={{ width: 40, height: 40, position: "relative" }}>
              <svg viewBox="0 0 48 48" style={{ width: 40, height: 40, animation: "spin 20s linear infinite" }}>
                <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
                <g stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.6">
                  <line x1="24" y1="2" x2="24" y2="8" /><line x1="24" y1="40" x2="24" y2="46" />
                  <line x1="2" y1="24" x2="8" y2="24" /><line x1="40" y1="24" x2="46" y2="24" />
                  <line x1="8" y1="8" x2="12" y2="12" /><line x1="36" y1="36" x2="40" y2="40" />
                  <line x1="40" y1="8" x2="36" y2="12" /><line x1="12" y1="36" x2="8" y2="40" />
                </g>
                <circle cx="24" cy="24" r="10" fill="url(#sg)" />
                <defs><radialGradient id="sg" cx="40%" cy="35%" r="60%">
                  <stop offset="0%" stopColor="#FCD34D" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </radialGradient></defs>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: S.sun, letterSpacing: -0.5, fontFamily: "system-ui, sans-serif" }}>
                SolarTax Fast Filing ☀️
              </div>
              <div style={{ fontSize: 10, color: S.muted, marginTop: 2, letterSpacing: 0.5 }}>
                IRS 1040 · Tax Year {taxYear.year} · Quick Submit Mode
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge color={S.sun} label={`Tax Year ${taxYear.year}`} />
            <Badge color={status === "submitted" ? S.green : S.blue} label={status.toUpperCase()} pulse />
            <Link href={`/tax-year/${taxYear.id}/optimize`} style={{ fontSize: 11, color: S.muted, textDecoration: "none", marginLeft: 8 }}>
              ← Back to Engine
            </Link>
          </div>
        </header>

        {/* ── STATUS MESSAGE ── */}
        {(message || error) && (
          <div style={{
            marginBottom: 24, padding: "12px 18px", borderRadius: 10,
            background: error ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
            border: `1px solid ${error ? S.red : S.green}40`,
            color: error ? S.red : S.green, fontSize: 12,
          }}>
            {error || message}
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, marginBottom: 20 }}>

          {/* LEFT: Taxpayer + Period */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Taxpayer card */}
            <Card title="☀ TAXPAYER" accent={S.sun}>
              <Field label="Household" value={household?.name ?? "—"} />
              <Field label="Filing Status" value={taxYear.filingStatus?.replace(/_/g, " ") ?? "—"} />
              <Field label="State" value={taxYear.state ?? "—"} />
              {dependents.length > 0 && (
                <Field label="Dependents" value={dependents.map((d: any) => `${d.firstName} ${d.lastName}`).join(", ")} />
              )}
            </Card>

            {/* Period card */}
            <Card title="📅 PERIOD" accent={S.blue}>
              <Field label="Tax Year" value={String(taxYear.year)} highlight />
              <Field label="Filing Type" value="Original Return" />
              <Field label="Due Date" value="April 15, 2026" />
              <Field label="Scenarios" value={`${scenarios.length} calculated`} />
            </Card>

            {/* Import card */}
            <Card title="⬇ IMPORT" accent={S.sunGlow}>
              <div style={{ fontSize: 11, color: S.muted, marginBottom: 12, lineHeight: 1.6 }}>
                Import income, expenses and dependents from previous year ({taxYear.year - 1}).
              </div>
              <ActionButton
                onClick={handleImport}
                loading={isPending}
                color={S.sun}
                icon="📥"
                label={`Import ${taxYear.year - 1} data`}
              />
              {status === "imported" && (
                <ActionButton
                  onClick={handleCalculate}
                  loading={isPending}
                  color={S.blue}
                  icon="⚡"
                  label="Recalculate"
                  style={{ marginTop: 8 }}
                />
              )}
            </Card>
          </div>

          {/* RIGHT: Income + Expenses */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Income */}
            <Card title={`↑ INCOME — VAT NALEŻNY`} accent={S.green} tag={`${incomeItems.length} items`}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                      {["SOURCE", "TYPE", "AMOUNT", "WITHHOLDING"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: S.muted, fontWeight: 600, letterSpacing: 0.5, fontSize: 9 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {incomeItems.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: "16px 8px", color: S.muted, fontSize: 11 }}>No income items — import previous year or add manually</td></tr>
                    ) : incomeItems.map((item: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${S.border}20` }}>
                        <td style={{ padding: "8px 8px", color: S.text }}>{item.source}</td>
                        <td style={{ padding: "8px 8px", color: S.muted, fontSize: 9 }}>{item.type}</td>
                        <td style={{ padding: "8px 8px", color: S.green, fontWeight: 700 }}>${fmt(parseFloat(item.amount || "0"))}</td>
                        <td style={{ padding: "8px 8px", color: S.muted }}>${fmt(parseFloat(item.withholding || "0"))}</td>
                      </tr>
                    ))}
                  </tbody>
                  {incomeItems.length > 0 && (
                    <tfoot>
                      <tr style={{ borderTop: `1px solid ${S.border}` }}>
                        <td colSpan={2} style={{ padding: "8px 8px", color: S.muted, fontSize: 10 }}>TOTAL</td>
                        <td style={{ padding: "8px 8px", color: S.green, fontWeight: 800, fontSize: 14 }}>${fmt(totalIncome)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Card>

            {/* Expenses */}
            <Card title="↓ EXPENSES — VAT NALICZONY" accent={S.red} tag={`${expenseItems.length} items`}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                      {["DESCRIPTION", "CATEGORY", "AMOUNT", "BIZ%", "ALLOWED"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: S.muted, fontWeight: 600, letterSpacing: 0.5, fontSize: 9 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenseItems.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: "16px 8px", color: S.muted, fontSize: 11 }}>No expense items — import previous year or add manually</td></tr>
                    ) : expenseItems.map((e: any, i: number) => {
                      const allowed = parseFloat(e.amount || "0") * e.businessPct / 100;
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${S.border}20` }}>
                          <td style={{ padding: "8px 8px", color: S.text }}>{e.description}</td>
                          <td style={{ padding: "8px 8px", color: S.muted, fontSize: 9 }}>{e.category}</td>
                          <td style={{ padding: "8px 8px", color: S.muted }}>${fmt(parseFloat(e.amount || "0"))}</td>
                          <td style={{ padding: "8px 8px", color: S.muted }}>{e.businessPct}%</td>
                          <td style={{ padding: "8px 8px", color: S.red, fontWeight: 700 }}>${fmt(allowed)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {expenseItems.length > 0 && (
                    <tfoot>
                      <tr style={{ borderTop: `1px solid ${S.border}` }}>
                        <td colSpan={2} style={{ padding: "8px 8px", color: S.muted, fontSize: 10 }}>TOTAL ENTERED</td>
                        <td style={{ padding: "8px 8px", color: S.text, fontWeight: 800, fontSize: 14 }}>${fmt(totalExpenses)}</td>
                        <td />
                        <td style={{ padding: "8px 8px", color: S.red, fontWeight: 800, fontSize: 14 }}>
                          ${fmt(expenseItems.reduce((s: number, e: any) => s + parseFloat(e.amount || "0") * e.businessPct / 100, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* ── CALCULATION SUMMARY ── */}
        <Card title="⚡ KALKULACJA — CALCULATION SUMMARY" accent={S.sun}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { label: "TOTAL INCOME", value: `$${fmt(totalIncome)}`, color: S.green },
              { label: "TOTAL TAX", value: `$${fmt(totalTax)}`, color: S.red },
              { label: "WITHHOLDING", value: `$${fmt(parseFloat(bestResult?.totalWithholding ?? "0"))}`, color: S.text },
              { label: "AMOUNT DUE", value: `$${fmt(amountDue)}`, color: amountDue > 0 ? S.red : S.green },
            ].map(c => (
              <div key={c.label} style={{ background: S.bg, borderRadius: 10, padding: "16px 20px", border: `1px solid ${S.border}` }}>
                <div style={{ fontSize: 9, color: S.muted, letterSpacing: 1, marginBottom: 8 }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.color, fontFamily: "system-ui, sans-serif" }}>{c.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── ACTIONS ── */}
        <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end" }}>
          <Link href={`/tax-year/${taxYear.id}`} style={{
            padding: "12px 20px", borderRadius: 8, border: `1px solid ${S.border}`,
            color: S.muted, fontSize: 12, textDecoration: "none", fontFamily: "inherit",
          }}>
            ← Edit Data
          </Link>

          <a href={downloadUrl} download style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 24px", borderRadius: 8,
            border: `1px solid ${S.blue}60`,
            background: `${S.blue}15`,
            color: S.blue, fontSize: 12, textDecoration: "none", fontFamily: "inherit", fontWeight: 700,
          }}>
            📄 Export PDF
          </a>

          <button
            onClick={handleSubmit}
            disabled={isPending || status === "submitted"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 8, border: "none",
              background: status === "submitted"
                ? `linear-gradient(135deg, ${S.green}, #059669)`
                : `linear-gradient(135deg, ${S.sun}, ${S.sunDeep})`,
              color: "#000", fontSize: 13, fontWeight: 800,
              cursor: status === "submitted" ? "default" : "pointer",
              boxShadow: `0 4px 20px ${S.sun}40`,
              fontFamily: "inherit", letterSpacing: 0.3,
              transition: "all .2s",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {status === "submitted" ? "✓ SUBMITTED" : "⬆ Submit to IRS"}
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, borderTop: `1px solid ${S.border}`, paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 10, color: S.muted }}>
            Generated by <span style={{ color: S.sun }}>SolarTax ☀️</span> · solar-tax.vercel.app
          </div>
          <div style={{ fontSize: 10, color: S.muted }}>
            For planning purposes only · Consult a licensed CPA before filing
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Card({ title, accent, children, tag }: { title: string; accent: string; children: React.ReactNode; tag?: string }) {
  return (
    <div style={{
      background: "#111827", borderRadius: 14, border: `1px solid #1F2937`,
      overflow: "hidden", position: "relative",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent}, ${accent}80)`,
      }} />
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #1F2937", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: accent, letterSpacing: 1.2 }}>{title}</span>
        {tag && <span style={{ fontSize: 9, color: "#6B7280", background: "#0B1220", padding: "2px 8px", borderRadius: 4, border: "1px solid #1F2937" }}>{tag}</span>}
      </div>
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1F293720" }}>
      <span style={{ fontSize: 10, color: "#6B7280" }}>{label}</span>
      <span style={{ fontSize: 11, color: highlight ? "#F59E0B" : "#F9FAFB", fontWeight: highlight ? 700 : 400 }}>{value}</span>
    </div>
  );
}

function Badge({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      borderRadius: 20, padding: "4px 12px",
      background: `${color}15`, border: `1px solid ${color}40`,
      fontSize: 9, fontWeight: 600, color, letterSpacing: 0.5,
    }}>
      {pulse && <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, animation: "blink 2s ease-in-out infinite" }} />}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      {label}
    </div>
  );
}

function ActionButton({ onClick, loading, color, icon, label, style: extraStyle }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%", padding: "10px 16px", borderRadius: 8, border: "none",
        background: `linear-gradient(135deg, ${color}, ${color}CC)`,
        color: "#000", fontSize: 12, fontWeight: 700,
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.6 : 1,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontFamily: "inherit", transition: "all .2s",
        boxShadow: `0 2px 12px ${color}40`,
        ...extraStyle,
      }}
    >
      {loading ? "⏳ Processing..." : `${icon} ${label}`}
    </button>
  );
}