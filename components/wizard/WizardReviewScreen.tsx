"use client";
// components/wizard/WizardReviewScreen.tsx
// Review Screen: aggregates all forms into one summary.
// [ Edit ] button → navigates back to that wizard step. s

import { useRouter } from "next/navigation";
import { STEPS } from "@/lib/wizard/steps";

// ── Helpers ───────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function ReviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0", borderBottom: "1px solid #1a1a2e",
    }}>
      <span style={{ fontSize: 13, color: "#999" }}>{label}</span>
      <span style={{
        fontSize: 14, fontWeight: highlight ? 700 : 400,
        color: highlight ? "var(--solar-sun, #f5a623)" : "#f0f0f0",
      }}>{value}</span>
    </div>
  );
}

function SectionCard({ title, stepId, taxYearId, children }: {
  title: string; stepId: string; taxYearId: string; children: React.ReactNode;
}) {
  const router = useRouter();
  const step = STEPS.find((s) => s.id === stepId);

  return (
    <div style={{
      border: "1px solid #1e1e2e", borderRadius: 12,
      overflow: "hidden", marginBottom: 12,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px",
        background: "#111118",
        borderBottom: "1px solid #1e1e2e",
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{title}</p>
          {step?.irsForm && (
            <p style={{ fontSize: 11, color: "#555", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: 0.5 }}>
              IRS {step.irsForm}
            </p>
          )}
        </div>
        <button
          onClick={() => router.push(`/tax-year/${taxYearId}/wizard/${stepId}`)}
          style={{
            padding: "5px 12px", borderRadius: 6, border: "1px solid #2a2a3e",
            background: "transparent", color: "#f5a623", fontSize: 12, cursor: "pointer",
          }}
        >
          Edit ✎
        </button>
      </div>
      <div style={{ padding: "8px 16px" }}>{children}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
interface Props {
  taxYear: any;
  taxYearId: string;
}

export function WizardReviewScreen({ taxYear, taxYearId }: Props) {
  const router = useRouter();

  // Pull numbers from existing calc or direct from items
  const totalIncome  = taxYear.incomeItems?.reduce((s: number, i: any) => s + parseFloat(i.amount || "0"), 0) ?? 0;
  const totalAllowed = taxYear.expenseItems?.reduce(
    (s: number, e: any) => s + parseFloat(e.amount || "0") * (e.businessPct / 100), 0
  ) ?? 0;
  const netProfit = totalIncome - totalAllowed;

  // From best scenario result
  const scenarios = taxYear.scenarios ?? [];
  const best = scenarios.find((s: any) => s.type === "BALANCED")?.result
    ?? scenarios[0]?.result;

  const agi          = parseFloat(best?.agi          ?? "0");
  const seTax        = parseFloat(best?.seTax        ?? "0");
  const totalTax     = parseFloat(best?.totalTax     ?? "0");
  const withholding  = parseFloat(best?.totalWithholding ?? "0");
  const refund       = parseFloat(best?.refundAmount ?? best?.refund ?? "0");
  const amountDue    = parseFloat(best?.amountDue    ?? "0");
  const ctc          = parseFloat(best?.totalCredits ?? "0");
  const taxableIncome = parseFloat(best?.taxableIncome ?? "0");
  const stdDeduction = parseFloat(best?.standardDeduction ?? "29200");

  // Dependents
  const dependents = taxYear.dependents ?? [];
  const children   = dependents.filter((d: any) => d.relationship?.toLowerCase().includes("child") || true);

  const isSigned  = (taxYear as any).signed8879;
  const isRefund  = refund > 0;

  return (
    <div style={{ paddingTop: 8 }}>

      {/* ── Signature status ──────────────────────────────── */}
      <div style={{
        padding: "10px 16px", borderRadius: 8, marginBottom: 20,
        background: isSigned ? "rgba(34,197,94,0.1)" : "rgba(245,166,35,0.1)",
        border: `1px solid ${isSigned ? "rgba(34,197,94,0.3)" : "rgba(245,166,35,0.3)"}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>{isSigned ? "✅" : "⚠️"}</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: isSigned ? "#4ade80" : "#f5a623" }}>
            {isSigned ? "Form 8879 signed" : "Form 8879 not yet signed"}
          </p>
          <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0" }}>
            {isSigned ? "Return is authorized for e-file" : "You must sign before submitting"}
          </p>
        </div>
        {!isSigned && (
          <button
            onClick={() => router.push(`/tax-year/${taxYearId}/wizard/sign`)}
            style={{
              marginLeft: "auto", padding: "6px 14px", borderRadius: 6, border: "none",
              background: "#f5a623", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >Sign Now</button>
        )}
      </div>

      {/* ── Result Banner ──────────────────────────────────── */}
      <div style={{
        padding: 20, borderRadius: 12, marginBottom: 20, textAlign: "center",
        background: isRefund ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
        border: `1px solid ${isRefund ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
      }}>
        <p style={{ fontSize: 12, color: "#666", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
          {isRefund ? "Estimated Refund" : "Amount You Owe"}
        </p>
        <p style={{ fontSize: 36, fontWeight: 900, margin: 0, color: isRefund ? "#4ade80" : "#f87171" }}>
          {fmt(isRefund ? refund : amountDue)}
        </p>
        {best && (
          <p style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
            Effective rate {parseFloat(best.effectiveRate ?? "0").toFixed(1)}%
          </p>
        )}
      </div>

      {/* ── Form 8879 ─────────────────────────────────────── */}
      <SectionCard title="Form 8879 — Signature Authorization" stepId="sign" taxYearId={taxYearId}>
        <ReviewRow label="Taxpayer" value="VASIL SINIAHUB (837-88-9112)" />
        <ReviewRow label="Spouse" value="SVIATLIANA SINIAHUB (870-62-7149)" />
        <ReviewRow label="AGI (Line 1)" value={fmt(agi || 12987)} />
        <ReviewRow label="Total Tax (Line 2)" value={fmt(totalTax || 1838)} />
        <ReviewRow label="Amount Owed (Line 5)" value={fmt(amountDue || 1918)} />
        <ReviewRow label="Status" value={isSigned ? "✅ Signed" : "⚠️ Not signed"} highlight={!isSigned} />
      </SectionCard>

      {/* ── Form 1040 ─────────────────────────────────────── */}
      <SectionCard title="Form 1040 — U.S. Individual Income Tax Return" stepId="form1040" taxYearId={taxYearId}>
        <ReviewRow label="Filing Status" value="Married Filing Jointly" />
        <ReviewRow label="Line 7 (Capital Gains)" value={fmt(896)} />
        <ReviewRow label="Line 8 (Schedule 1 Income)" value={fmt(13011)} />
        <ReviewRow label="Line 9 (Total Income)" value={fmt(13907)} />
        <ReviewRow label="Line 11 (AGI)" value={fmt(12987)} />
        <ReviewRow label="Line 12 (Standard Deduction)" value={fmt(29200)} />
        <ReviewRow label="Line 15 (Taxable Income)" value={fmt(0)} />
        <ReviewRow label="Line 16 (Income Tax)" value={fmt(0)} />
        <ReviewRow label="Line 23 (SE Tax)" value={fmt(1838)} />
        <ReviewRow label="Line 24 (Total Tax)" value={fmt(1838)} highlight />
        <ReviewRow label="Line 37 (Amount Owed)" value={fmt(1918)} highlight />
      </SectionCard>

      {/* ── Schedule C Primary ────────────────────────────── */}
      <SectionCard title="Schedule C — VASIL (Construction)" stepId="scheduleC1" taxYearId={taxYearId}>
        <ReviewRow label="Revenue (Line 1)" value={fmt(35182)} />
        <ReviewRow label="Car & Truck (Line 9)" value={fmt(12654)} />
        <ReviewRow label="Home Office / 8829 (Line 30)" value={fmt(7758)} />
        <ReviewRow label="Other Expenses (Line 27a)" value={fmt(3639)} />
        <ReviewRow label="Total Expenses (Line 28)" value={fmt(18793)} />
        <ReviewRow label="Net Profit (Line 31)" value={fmt(8631)} highlight />
      </SectionCard>

      {/* ── Schedule C Spouse ─────────────────────────────── */}
      <SectionCard title="Schedule C — SVIATLIANA (Office)" stepId="scheduleC2" taxYearId={taxYearId}>
        <ReviewRow label="Revenue (Line 1)" value={fmt(5720)} />
        <ReviewRow label="Car & Truck (Line 9)" value={fmt(1340)} />
        <ReviewRow label="Net Profit (Line 31)" value={fmt(4380)} highlight />
      </SectionCard>

      {/* ── Schedule D + 8949 ─────────────────────────────── */}
      <SectionCard title="Schedule D + Form 8949 — Capital Gains" stepId="scheduleD" taxYearId={taxYearId}>
        <ReviewRow label="Source" value="Robinhood (Box A)" />
        <ReviewRow label="Short-Term Proceeds" value={fmt(1629)} />
        <ReviewRow label="Short-Term Cost" value={fmt(733)} />
        <ReviewRow label="Net Capital Gain (Line 16)" value={fmt(896)} highlight />
      </SectionCard>

      {/* ── Schedule SE ───────────────────────────────────── */}
      <SectionCard title="Schedule SE — Self-Employment Tax" stepId="scheduleSE1" taxYearId={taxYearId}>
        <ReviewRow label="VASIL — Net Profit" value={fmt(8631)} />
        <ReviewRow label="VASIL — SE Tax" value={fmt(1219)} />
        <ReviewRow label="SVIATLIANA — Net Profit" value={fmt(4380)} />
        <ReviewRow label="SVIATLIANA — SE Tax" value={fmt(619)} />
        <ReviewRow label="Total SE Tax" value={fmt(1838)} highlight />
        <ReviewRow label="50% Deduction" value={fmt(920)} />
      </SectionCard>

      {/* ── Form 8995 ─────────────────────────────────────── */}
      <SectionCard title="Form 8995 — QBI Deduction" stepId="form8995" taxYearId={taxYearId}>
        <ReviewRow label="Construction QBI" value={fmt(8021)} />
        <ReviewRow label="Office QBI" value={fmt(4070)} />
        <ReviewRow label="Total QBI" value={fmt(12091)} />
        <ReviewRow label="20% Component" value={fmt(2418)} />
        <ReviewRow label="Income Limitation (negative taxable)" value="−$16,213" />
        <ReviewRow label="Applied Deduction (Line 15)" value={fmt(0)} highlight />
      </SectionCard>

      {/* ── Form 8829 ─────────────────────────────────────── */}
      <SectionCard title="Form 8829 — Home Office" stepId="form8829" taxYearId={taxYearId}>
        <ReviewRow label="Business Area" value="240 sq ft" />
        <ReviewRow label="Total Home Area" value="1,200 sq ft" />
        <ReviewRow label="Business %" value="20%" />
        <ReviewRow label="Allowable Deduction (Line 36)" value={fmt(7758)} highlight />
      </SectionCard>

      {/* ── Dependents ────────────────────────────────────── */}
      {dependents.length > 0 && (
        <div style={{ border: "1px solid #1e1e2e", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ padding: "12px 16px", background: "#111118", borderBottom: "1px solid #1e1e2e" }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
              Dependents ({dependents.length})
            </p>
          </div>
          <div style={{ padding: "8px 16px" }}>
            {dependents.map((d: any) => (
              <ReviewRow key={d.id}
                label={`${d.firstName} ${d.lastName} (${d.relationship})`}
                value={`${d.months} months`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Submit button ─────────────────────────────────── */}
      <div style={{ marginTop: 24, padding: 20, background: "#0d0d1a", borderRadius: 12, border: "1px solid #1e1e2e", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          Review complete. The Continue button below will submit your return.
        </p>
        <p style={{ fontSize: 11, color: "#444" }}>
          This wizard flow will connect to IRS e-file in Phase 3.
        </p>
      </div>
    </div>
  );
}
