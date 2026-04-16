"use client";
// components/wizard/forms/ScheduleSEParallel.tsx
// Schedule SE — fully derived from Schedule C.
// Read-only. Edit source = Edit Schedule C.

const SS_WAGE_BASE = 168600;

function calcSE(netProfit: number) {
  const seEarnings = netProfit * 0.9235;
  if (seEarnings < 400) return { seEarnings: 0, ssTax: 0, medTax: 0, seTax: 0, deduction: 0 };
  const ssTax     = Math.min(seEarnings, SS_WAGE_BASE) * 0.124;
  const medTax    = seEarnings * 0.029;
  const seTax     = Math.round(ssTax + medTax);
  const deduction = Math.round(seTax * 0.5);
  return {
    seEarnings: Math.round(seEarnings),
    ssTax:      Math.round(ssTax),
    medTax:     Math.round(medTax),
    seTax,
    deduction,
  };
}

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

interface SECardProps {
  label:      string;
  color:      string;
  netProfit:  number;
  taxYearId?: string;
  scrollId?:  string;  // id of the ScheduleC card to scroll to
}

function SECard({ label, color, netProfit, taxYearId, scrollId }: SECardProps) {
  const r = calcSE(netProfit);

  // Scroll to the matching Schedule C block
  const handleEditClick = (e: React.MouseEvent) => {
    if (scrollId) {
      const el = document.getElementById(scrollId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Flash highlight
        el.style.transition = "box-shadow 0.3s";
        el.style.boxShadow  = "0 0 0 3px rgba(245,166,35,0.6)";
        setTimeout(() => { el.style.boxShadow = ""; }, 1800);
      }
    }
  };

  const Line = ({ num, label, value, formula, bold, red, green, highlight }: {
    num: string; label: string; value: string; formula?: string;
    bold?: boolean; red?: boolean; green?: boolean; highlight?: boolean;
  }) => (
    <div style={{
      display: "flex", alignItems: "baseline", padding: "7px 16px",
      borderBottom: "1px solid #111",
      background: highlight ? "rgba(255,255,255,0.03)" : "transparent",
    }}>
      <span style={{ width: 28, fontSize: 10, fontWeight: 700, color: "#f5a623", flexShrink: 0 }}>{num}</span>
      <span style={{ flex: 1, fontSize: 11, color: "#888" }}>
        {label}
        {formula && (
          <span style={{ marginLeft: 6, fontSize: 9, color: "#444", fontFamily: "monospace" }}>
            = {formula}
          </span>
        )}
      </span>
      <span style={{
        fontSize: bold ? 14 : 11, fontWeight: bold ? 800 : 600, fontFamily: "monospace",
        color: red ? "#f87171" : green ? "#4ade80" : "#f0f0f0",
      }}>
        {value}
      </span>
    </div>
  );

  return (
    <div style={{ border: "1px solid #1e1e2e", borderRadius: 12, overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "10px 16px", background: "#111118", borderBottom: "1px solid #1e1e2e", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13 }}>👤</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Schedule SE · Part I
          </div>
        </div>
        {r.seTax > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#555" }}>SE Tax</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f87171", fontFamily: "monospace" }}>
              {fmt(r.seTax)}
            </div>
          </div>
        )}
      </div>

      {/* Source line — derived */}
      <div style={{
        padding: "12px 16px", background: "#0d0d18",
        borderBottom: "1px solid #111",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
            Line 2 — Net profit from Schedule C Line 31
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", color: netProfit > 0 ? "#4ade80" : "#f87171" }}>
              {fmt(netProfit)}
            </span>
            <span style={{
              fontSize: 9, padding: "2px 6px", borderRadius: 4,
              background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
              color: "#4ade80",
            }}>
              calculated
            </span>
          </div>
        </div>
        {/* Edit source button — scrolls to Schedule C */}
        <a
          href={taxYearId ? `/tax-year/${taxYearId}/wizard/scheduleC` : "#"}
          onClick={handleEditClick}
          style={{
            fontSize: 10, padding: "7px 12px", borderRadius: 8,
            border: "1px solid #2a2a3e", color: "#aaa",
            textDecoration: "none", display: "flex", alignItems: "center", gap: 5,
            background: "#111118", flexShrink: 0,
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "#f5a623";
            (e.currentTarget as HTMLElement).style.color = "#f5a623";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "#2a2a3e";
            (e.currentTarget as HTMLElement).style.color = "#aaa";
          }}
        >
          ✏ Edit Schedule C →
        </a>
      </div>

      {/* ── MINI BREAKDOWN ──────────────────────────────────── */}
      {netProfit > 0 && (
        <div style={{
          padding: "10px 16px", background: "#0a0a0f",
          borderBottom: "1px solid #111",
        }}>
          <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            SE Tax Breakdown
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            flexWrap: "wrap", fontSize: 11, fontFamily: "monospace",
          }}>
            <span style={{ color: "#4ade80" }}>{fmt(netProfit)}</span>
            <span style={{ color: "#333" }}>×</span>
            <span style={{ color: "#888" }}>92.35%</span>
            <span style={{ color: "#333" }}>=</span>
            <span style={{ color: "#f0f0f0" }}>{fmt(r.seEarnings)}</span>
            <span style={{ color: "#333" }}>×</span>
            <span style={{ color: "#888" }}>15.3%</span>
            <span style={{ color: "#333" }}>≈</span>
            <span style={{ color: "#f87171", fontWeight: 800 }}>{fmt(r.seTax)}</span>
            <span style={{ color: "#555" }}>SE tax</span>
            <span style={{ color: "#333", margin: "0 4px" }}>·</span>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>{fmt(r.deduction)}</span>
            <span style={{ color: "#555" }}>deductible</span>
          </div>
        </div>
      )}

      {/* Calculated lines */}
      <Line num="4a" label="Net SE earnings (×92.35%)" value={fmt(r.seEarnings)} formula={`${fmt(netProfit)} × 0.9235`} />
      <Line num="10" label="Social Security (×12.4%, cap $168,600)" value={fmt(r.ssTax)} formula={`min(earnings, ${fmt(SS_WAGE_BASE)}) × 12.4%`} />
      <Line num="11" label="Medicare (×2.9%)" value={fmt(r.medTax)} formula={`${fmt(r.seEarnings)} × 2.9%`} />
      <Line num="12" label="SE tax → Schedule 2 Line 4" value={fmt(r.seTax)} formula="SS + Medicare" bold red highlight />
      <Line num="13" label="½ Deduction → Schedule 1 Line 15" value={fmt(r.deduction)} formula={`${fmt(r.seTax)} × 50%`} bold green highlight />

      {/* Footer watermark */}
      <div style={{ padding: "6px 16px", background: "#0a0a0f", fontSize: 9, color: "#333", display: "flex", alignItems: "center", gap: 4 }}>
        🔒 Derived from Schedule C · change income/expenses there to update
      </div>
    </div>
  );
}

interface Props {
  primaryNetProfit?: number;
  spouseNetProfit?:  number;
  taxYearId?:        string;
}

export function ScheduleSEParallel({ primaryNetProfit = 0, spouseNetProfit = 0, taxYearId }: Props) {
  const rP = calcSE(primaryNetProfit);
  const rS = calcSE(spouseNetProfit);
  const combinedSE  = rP.seTax + rS.seTax;
  const combinedDed = rP.deduction + rS.deduction;

  return (
    <div>
      {/* Header */}
      <div style={{
        marginBottom: 16, padding: "10px 16px",
        background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.15)",
        borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>Schedule SE — Self-Employment Tax</span>
          <span style={{ fontSize: 10, color: "#666", marginLeft: 10 }}>Derived from Schedule C · taxpayer and spouse separately</span>
        </div>
        <div style={{
          fontSize: 9, padding: "3px 8px", borderRadius: 4,
          background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", color: "#4ade80",
        }}>
          calculated · read-only
        </div>
      </div>

      {/* Side-by-side cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SECard
          label="Taxpayer (Primary)"
          color="#f5a623"
          netProfit={primaryNetProfit}
          taxYearId={taxYearId}
          scrollId="scheduleC-primary"
        />
        <SECard
          label="Spouse"
          color="#818cf8"
          netProfit={spouseNetProfit}
          taxYearId={taxYearId}
          scrollId="scheduleC-spouse"
        />
      </div>

      {/* Combined totals */}
      <div style={{
        marginTop: 16, padding: "14px 20px",
        border: "1px solid #1e1e2e", borderRadius: 10, background: "#111118",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, alignItems: "center",
      }}>
        {[
          { label: "Primary SE Tax",         val: rP.seTax,    color: "#f87171" },
          { label: "Spouse SE Tax",          val: rS.seTax,    color: "#f87171" },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{fmt(s.val)}</div>
          </div>
        ))}
        <div style={{ background: "rgba(248,113,113,0.08)", padding: "8px 12px", borderRadius: 8 }}>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Combined → Sch 2 Line 4</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#f87171", fontFamily: "monospace" }}>{fmt(combinedSE)}</div>
        </div>
        <div style={{ background: "rgba(74,222,128,0.08)", padding: "8px 12px", borderRadius: 8 }}>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Combined ½ Ded → Sch 1</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80", fontFamily: "monospace" }}>{fmt(combinedDed)}</div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: "#444", textAlign: "center" }}>
        SE tax → Schedule 2 Line 4 → Form 1040 Line 23 · ½ deduction → Schedule 1 Line 15 → Form 1040 Line 10
      </div>
    </div>
  );
}
