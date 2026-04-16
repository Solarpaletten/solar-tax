"use client";
// components/wizard/forms/ScheduleCParallel.tsx
// Shows Schedule C for PRIMARY and SPOUSE side-by-side on desktop,
// stacked on mobile. Each form is fully editable. s

import { useState, useCallback } from "react";
import { ScheduleCForm } from "./ScheduleCForm";

interface NetProfit {
  primary: number;
  spouse:  number;
}

interface Props {
  taxYearId?: string;
  onNetProfitChange?: (profits: NetProfit) => void;
}

export function ScheduleCParallel({ taxYearId, onNetProfitChange }: Props) {
  const [primaryProfit, setPrimaryProfit] = useState(0);
  const [spouseProfit,  setSpouseProfit]  = useState(0);

  const handlePrimary = useCallback((data: any) => {
    const profit = data?.netProfit ?? 0;
    setPrimaryProfit(profit);
    onNetProfitChange?.({ primary: profit, spouse: spouseProfit });
  }, [spouseProfit, onNetProfitChange]);

  const handleSpouse = useCallback((data: any) => {
    const profit = data?.netProfit ?? 0;
    setSpouseProfit(profit);
    onNetProfitChange?.({ primary: primaryProfit, spouse: profit });
  }, [primaryProfit, onNetProfitChange]);

  const combined = primaryProfit + spouseProfit;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, padding: "10px 16px",
        background: "rgba(245,166,35,0.05)",
        border: "1px solid rgba(245,166,35,0.15)",
        borderRadius: 10,
      }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>
            Schedule C — Business Income
          </span>
          <span style={{ fontSize: 10, color: "#666", marginLeft: 10 }}>
            Both businesses shown side-by-side
          </span>
        </div>
        {combined !== 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#666" }}>Combined Net Profit</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: combined >= 0 ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>
              ${Math.abs(combined).toLocaleString("en-US")}
            </div>
          </div>
        )}
      </div>

      {/* Side-by-side grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        // Stack on narrow screens
      }}>
        {/* PRIMARY */}
        <div id="scheduleC-primary">
          <div style={{
            padding: "8px 14px",
            background: "rgba(245,166,35,0.08)",
            borderRadius: "10px 10px 0 0",
            border: "1px solid rgba(245,166,35,0.25)",
            borderBottom: "none",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>👤</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f5a623" }}>Taxpayer (Primary)</div>
              <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>Schedule C — Page 1</div>
            </div>
          </div>
          <ScheduleCForm
            mode="primary"
            taxYearId={taxYearId}
            onDataChange={handlePrimary}
          />
        </div>

        {/* SPOUSE */}
        <div id="scheduleC-spouse">
          <div style={{
            padding: "8px 14px",
            background: "rgba(99,102,241,0.08)",
            borderRadius: "10px 10px 0 0",
            border: "1px solid rgba(99,102,241,0.25)",
            borderBottom: "none",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>👤</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8" }}>Spouse</div>
              <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>Schedule C — Page 1</div>
            </div>
          </div>
          <ScheduleCForm
            mode="spouse"
            taxYearId={taxYearId}
            onDataChange={handleSpouse}
          />
        </div>
      </div>

      {/* Combined summary bar */}
      <div style={{
        marginTop: 16, padding: "12px 20px",
        border: "1px solid #1e1e2e", borderRadius: 10,
        background: "#111118",
        display: "flex", gap: 32, alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Primary Net Profit</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: primaryProfit >= 0 ? "#4ade80" : "#f87171" }}>
            ${Math.abs(primaryProfit).toLocaleString("en-US")}
          </div>
        </div>
        <div style={{ fontSize: 18, color: "#333" }}>+</div>
        <div>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Spouse Net Profit</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: spouseProfit >= 0 ? "#4ade80" : "#f87171" }}>
            ${Math.abs(spouseProfit).toLocaleString("en-US")}
          </div>
        </div>
        <div style={{ fontSize: 18, color: "#333" }}>=</div>
        <div>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Combined → Schedule 1 Line 3</div>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "monospace", color: combined >= 0 ? "#4ade80" : "#f87171" }}>
            ${Math.abs(combined).toLocaleString("en-US")}
          </div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 10, color: "#444", fontStyle: "italic" }}>
          Flows to: Schedule 1 → Form 1040 Line 8
        </div>
      </div>
    </div>
  );
}
