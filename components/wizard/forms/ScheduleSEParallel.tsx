"use client";
// components/wizard/forms/ScheduleSEParallel.tsx
// Shows Schedule SE for PRIMARY and SPOUSE side-by-side.
// Each calculates independently. Combined flows to Schedule 2 / Form 1040. s

import { useState } from "react";

const SS_WAGE_BASE = 168600;

function calcSE(netProfit: number) {
  const seEarnings = netProfit * 0.9235;
  if (seEarnings < 400) return { seEarnings: 0, ssTax: 0, medTax: 0, seTax: 0, deduction: 0 };
  const ssTax    = Math.min(seEarnings, SS_WAGE_BASE) * 0.124;
  const medTax   = seEarnings * 0.029;
  const seTax    = Math.round(ssTax + medTax);
  const deduction = Math.round(seTax * 0.5);
  return { seEarnings: Math.round(seEarnings), ssTax: Math.round(ssTax), medTax: Math.round(medTax), seTax, deduction };
}

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US");
}
function pct(n: number) {
  return n.toFixed(2) + "%";
}

interface SECardProps {
  label:     string;
  color:     string;
  netProfit: number;
  onNetProfitChange: (v: number) => void;
}

function SECard({ label, color, netProfit, onNetProfitChange }: SECardProps) {
  const [input, setInput] = useState(String(Math.round(netProfit)));
  const profit = parseFloat(input) || 0;
  const r = calcSE(profit);

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid #1e1e2e", background: "#0a0a0f",
    color: "#f0f0f0", fontSize: 14, fontFamily: "system-ui",
    outline: "none",
  };

  const Line = ({ num, label, value, formula, bold, red, green }: {
    num: string; label: string; value: string; formula?: string;
    bold?: boolean; red?: boolean; green?: boolean;
  }) => (
    <div style={{
      display: "flex", alignItems: "baseline", padding: "7px 16px",
      borderBottom: "1px solid #111",
      background: bold ? "rgba(255,255,255,0.03)" : "transparent",
    }}>
      <span style={{ width: 28, fontSize: 10, fontWeight: 700, color: "#f5a623", flexShrink: 0 }}>{num}</span>
      <span style={{ flex: 1, fontSize: 11, color: "#888" }}>
        {label}
        {formula && <span style={{ marginLeft: 6, fontSize: 9, color: "#444", fontFamily: "monospace" }}>= {formula}</span>}
      </span>
      <span style={{
        fontSize: bold ? 14 : 11, fontWeight: bold ? 800 : 600,
        fontFamily: "monospace",
        color: red ? "#f87171" : green ? "#4ade80" : "#f0f0f0",
      }}>
        {value}
      </span>
    </div>
  );

  return (
    <div style={{ border: "1px solid #1e1e2e", borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "10px 16px", display: "flex", alignItems: "center", gap: 8,
        background: "#111118", borderBottom: "1px solid #1e1e2e",
      }}>
        <span style={{ fontSize: 13 }}>👤</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Schedule SE (Form 1040) · Part I
          </div>
        </div>
        {r.seTax > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#555" }}>SE Tax</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f87171", fontFamily: "monospace" }}>{fmt(r.seTax)}</div>
          </div>
        )}
      </div>

      {/* Input: Net profit from Schedule C */}
      <div style={{ padding: "12px 16px", background: "#0d0d18", borderBottom: "1px solid #111" }}>
        <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Line 2 — Net profit from Schedule C ✏ editable
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="number"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              onNetProfitChange(parseFloat(e.target.value) || 0);
            }}
            style={{ ...inp, flex: 1 }}
          />
          <span style={{ fontSize: 10, color: "#444", whiteSpace: "nowrap" }}>from Sch C Line 31</span>
        </div>
      </div>

      {/* Calculated lines */}
      <div>
        <Line num="4a" label="SE earnings (×92.35%)"         value={fmt(r.seEarnings)} formula={`${fmt(profit)} × 0.9235`} />
        <Line num="10" label="Social Security tax (×12.4%)"  value={fmt(r.ssTax)}      formula={`min(${fmt(r.seEarnings)}, ${fmt(SS_WAGE_BASE)}) × 12.4%`} />
        <Line num="11" label="Medicare tax (×2.9%)"          value={fmt(r.medTax)}     formula={`${fmt(r.seEarnings)} × 2.9%`} />
        <Line num="12" label="Self-employment tax → Sch 2"   value={fmt(r.seTax)}      formula="SS + Medicare" bold red />
        <Line num="13" label="½ SE deduction → Schedule 1"   value={fmt(r.deduction)}  formula={`${fmt(r.seTax)} × 50%`} bold green />
      </div>
    </div>
  );
}

interface Props {
  primaryNetProfit?: number;
  spouseNetProfit?:  number;
}

export function ScheduleSEParallel({
  primaryNetProfit = 0,
  spouseNetProfit  = 0,
}: Props) {
  const [primaryProfit, setPrimaryProfit] = useState(primaryNetProfit);
  const [spouseProfit,  setSpouseProfit]  = useState(spouseNetProfit);

  const rP = calcSE(primaryProfit);
  const rS = calcSE(spouseProfit);

  const combinedSE  = rP.seTax + rS.seTax;
  const combinedDed = rP.deduction + rS.deduction;

  return (
    <div>
      {/* Header */}
      <div style={{
        marginBottom: 16, padding: "10px 16px",
        background: "rgba(245,166,35,0.05)",
        border: "1px solid rgba(245,166,35,0.15)", borderRadius: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>
            Schedule SE — Self-Employment Tax
          </span>
          <span style={{ fontSize: 10, color: "#666", marginLeft: 10 }}>
            Taxpayer and spouse calculated separately
          </span>
        </div>
        <div style={{ fontSize: 9, color: "#555", fontStyle: "italic" }}>
          Net profit from Schedule C is editable below
        </div>
      </div>

      {/* Side-by-side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SECard
          label="Taxpayer (Primary)"
          color="#f5a623"
          netProfit={primaryProfit}
          onNetProfitChange={setPrimaryProfit}
        />
        <SECard
          label="Spouse"
          color="#818cf8"
          netProfit={spouseProfit}
          onNetProfitChange={setSpouseProfit}
        />
      </div>

      {/* Combined totals */}
      <div style={{
        marginTop: 16, padding: "14px 20px",
        border: "1px solid #1e1e2e", borderRadius: 10,
        background: "#111118",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Primary SE Tax</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171", fontFamily: "monospace" }}>{fmt(rP.seTax)}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Spouse SE Tax</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171", fontFamily: "monospace" }}>{fmt(rS.seTax)}</div>
        </div>
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
        SE tax flows → Schedule 2 Line 4 → Form 1040 Line 23 ·
        ½ deduction flows → Schedule 1 Line 15 → Form 1040 Line 10
      </div>
    </div>
  );
}
