"use client";
// components/wizard/forms/ScheduleCForm.tsx
// Real Schedule C — IRS Profit or Loss From Business
// Two modes: primary (Construction) and spouse (Office)
// Live net profit calculation — feeds directly into SE tax display s

import { useState, useEffect } from "react";

// ── IRS 2024 mileage rate ──────────────────────────────────
const MILEAGE_RATE_2024 = 0.67; // $0.67/mile standard rate

// ── Styles ────────────────────────────────────────────────
const S = {
  label: {
    fontSize: 11, color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: 0.8, marginBottom: 4, display: "block",
  },
  input: {
    width: "100%", padding: "10px 12px",
    borderRadius: 8, border: "1px solid #1e1e2e",
    background: "#0a0a0f", color: "#f0f0f0",
    fontSize: 14, fontFamily: "system-ui",
    outline: "none",
  } as React.CSSProperties,
  readOnly: {
    width: "100%", padding: "10px 12px",
    borderRadius: 8, border: "1px solid #1a1a2a",
    background: "#0d0d18", color: "#888",
    fontSize: 14, fontFamily: "system-ui",
  } as React.CSSProperties,
  section: {
    border: "1px solid #1e1e2e", borderRadius: 12,
    overflow: "hidden", marginBottom: 16,
  },
  sectionHeader: {
    padding: "10px 16px", background: "#111118",
    borderBottom: "1px solid #1e1e2e",
    fontSize: 11, fontWeight: 700 as const,
    color: "#888", textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  sectionBody: { padding: "16px" },
  row: { marginBottom: 14 },
  grid2: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
  },
  grid3: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
  },
  divider: {
    height: 1, background: "#1a1a2e", margin: "12px 0",
  },
  resultRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "8px 0",
    borderBottom: "1px solid #111",
  },
};

function num(s: string): number {
  return parseFloat(s.replace(/[^0-9.-]/g, "")) || 0;
}
function fmt(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

interface ScheduleCProps {
  mode: "primary" | "spouse";
  // Pre-fill from existing DB data (from wizard taxYear)
  initialData?: {
    revenue?: number;
    returns?: number;
    carMiles?: number;
    useActualCar?: boolean;
    actualCarAmount?: number;
    advertising?: number;
    commissions?: number;
    insurance?: number;
    officeExpense?: number;
    repairs?: number;
    supplies?: number;
    taxes?: number;
    utilities?: number;
    wages?: number;
    otherExpenses?: OtherExpense[];
    homeOfficeSqft?: number;
    totalHomeSqft?: number;
    rent?: number;
    homeOfficeAllowable?: number;
    businessName?: string;
    occupation?: string;
    ssn?: string;
  };
  onDataChange?: (data: ScheduleCData) => void;
}

interface OtherExpense {
  description: string;
  amount: string;
}

export interface ScheduleCData {
  revenue: number;
  returns: number;
  grossIncome: number;
  carExpense: number;
  carMiles: number;
  useActualCar: boolean;
  otherExpensesTotal: number;
  homeOfficeAllowable: number;
  totalExpenses: number;
  tentativeProfit: number;
  netProfit: number;
  businessName: string;
  occupation: string;
}

export function ScheduleCForm({ mode, initialData, onDataChange }: ScheduleCProps) {
  const isPrimary = mode === "primary";

  // ── Part I — Income ───────────────────────────────────────
  const [revenue,     setRevenue]     = useState(String(initialData?.revenue ?? (isPrimary ? 35182 : 5720)));
  const [returns,     setReturns]     = useState(String(initialData?.returns ?? 0));

  // ── Part II — Expenses ────────────────────────────────────
  const [useActualCar,  setUseActualCar]  = useState(initialData?.useActualCar ?? false);
  const [carMiles,      setCarMiles]      = useState(String(initialData?.carMiles ?? (isPrimary ? 18886 : 2000)));
  const [actualCar,     setActualCar]     = useState(String(initialData?.actualCarAmount ?? (isPrimary ? 12654 : 1340)));
  const [advertising,   setAdvertising]   = useState(String(initialData?.advertising ?? 0));
  const [commissions,   setCommissions]   = useState(String(initialData?.commissions ?? 0));
  const [insurance,     setInsurance]     = useState(String(initialData?.insurance ?? 0));
  const [officeExp,     setOfficeExp]     = useState(String(initialData?.officeExpense ?? 0));
  const [repairs,       setRepairs]       = useState(String(initialData?.repairs ?? 0));
  const [supplies,      setSupplies]      = useState(String(initialData?.supplies ?? 0));
  const [taxes,         setTaxes]         = useState(String(initialData?.taxes ?? 0));
  const [utilities,     setUtilities]     = useState(String(initialData?.utilities ?? 0));
  const [wages,         setWages]         = useState(String(initialData?.wages ?? 0));

  // Part V — Other Expenses
  const defaultOther: OtherExpense[] = isPrimary
    ? [
        { description: "Phone",        amount: "1327" },
        { description: "Electronics",  amount: "1200" },
        { description: "Small Tools",  amount: "755"  },
        { description: "Uniform",      amount: "357"  },
      ]
    : [];
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>(
    initialData?.otherExpenses ?? defaultOther
  );

  // Part IV — Vehicle
  const [vehicleDate,  setVehicleDate]  = useState(isPrimary ? "01-01-2024" : "01-01-2024");
  const [hasEvidence,  setHasEvidence]  = useState(true);
  const [writtenEvid,  setWrittenEvid]  = useState(true);

  // Form 8829 — Home Office (only for primary / VASIL)
  const [homeBizSqft,  setHomeBizSqft]  = useState(String(initialData?.homeOfficeSqft ?? (isPrimary ? 240 : 0)));
  const [homeTotalSqft,setHomeTotalSqft]= useState(String(initialData?.totalHomeSqft ?? (isPrimary ? 1200 : 0)));
  const [homeRent,     setHomeRent]     = useState(String(initialData?.rent ?? (isPrimary ? 18000 : 0)));
  const showHomeOffice = isPrimary;

  // Business info
  const [bizName, setBizName] = useState(initialData?.businessName ?? "");
  const [occupation, setOccupation] = useState(
    initialData?.occupation ?? (isPrimary ? "CONSTRUCTION" : "OFFICE")
  );

  // ── Live Calculations ──────────────────────────────────────
  const revN  = num(revenue);
  const retN  = num(returns);
  const grossIncome = Math.max(0, revN - retN);

  // Car expense
  const carExpense = useActualCar
    ? num(actualCar)
    : Math.round(num(carMiles) * MILEAGE_RATE_2024);

  // Other expenses total
  const otherTotal = otherExpenses.reduce((s, e) => s + num(e.amount), 0);

  // Home office (8829 simplified)
  const homePct = num(homeTotalSqft) > 0
    ? num(homeBizSqft) / num(homeTotalSqft)
    : 0;
  const homeOfficeAllowable = showHomeOffice
    ? Math.round(num(homeRent) * homePct)
    : 0;

  // Total expenses (Line 28)
  const totalExpenses =
    num(advertising) + carExpense + num(commissions) +
    num(insurance) + num(officeExp) + num(repairs) +
    num(supplies) + num(taxes) + num(utilities) +
    num(wages) + otherTotal;

  // Tentative profit (Line 29 = Line 7 - Line 28)
  const tentativeProfit = grossIncome - totalExpenses;

  // Net profit (Line 31 = Line 29 - Line 30 home office)
  const netProfit = tentativeProfit - homeOfficeAllowable;

  // SE Tax preview
  const seEarnings = Math.max(0, netProfit) * 0.9235;
  const seTax = seEarnings > 400
    ? Math.round(Math.min(seEarnings, 168600) * 0.124 + seEarnings * 0.029)
    : 0;

  // Notify parent on change
  useEffect(() => {
    onDataChange?.({
      revenue: revN, returns: retN, grossIncome,
      carExpense, carMiles: num(carMiles), useActualCar,
      otherExpensesTotal: otherTotal,
      homeOfficeAllowable,
      totalExpenses,
      tentativeProfit,
      netProfit,
      businessName: bizName,
      occupation,
    });
  }, [revenue, returns, carMiles, actualCar, useActualCar, advertising,
      commissions, insurance, officeExp, repairs, supplies, taxes, utilities,
      wages, otherExpenses, homeBizSqft, homeTotalSqft, homeRent]);

  const setOther = (i: number, field: "description" | "amount", val: string) => {
    setOtherExpenses(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  };
  const addOther = () => setOtherExpenses(prev => [...prev, { description: "", amount: "" }]);
  const removeOther = (i: number) => setOtherExpenses(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* ── Business Info ─────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHeader}>Business Information</div>
        <div style={S.sectionBody}>
          <div style={{ ...S.grid2, marginBottom: 12 }}>
            <div style={S.row}>
              <label style={S.label}>
                {isPrimary ? "Taxpayer" : "Spouse"} Name
              </label>
              <input
                style={S.readOnly}
                value={isPrimary ? "VASIL SINIAHUB" : "SVIATLIANA SINIAHUB"}
                readOnly
              />
            </div>
            <div style={S.row}>
              <label style={S.label}>SSN</label>
              <input
                style={S.readOnly}
                value={isPrimary ? "837-88-9112" : "870-62-7149"}
                readOnly
              />
            </div>
          </div>
          <div style={{ ...S.grid2 }}>
            <div style={S.row}>
              <label style={S.label}>Business / Occupation (Line A)</label>
              <input
                style={S.input}
                value={occupation}
                onChange={e => setOccupation(e.target.value)}
                placeholder="e.g. CONSTRUCTION"
              />
            </div>
            <div style={S.row}>
              <label style={S.label}>Business Name (Line C — optional)</label>
              <input
                style={S.input}
                value={bizName}
                onChange={e => setBizName(e.target.value)}
                placeholder="Leave blank if no separate name"
              />
            </div>
          </div>
          <div style={S.row}>
            <label style={S.label}>Business Address (Line E)</label>
            <input
              style={S.readOnly}
              value="807 GULL RD, Venice, FL 34293"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* ── Part I — Income ───────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHeader}>Part I — Income</div>
        <div style={S.sectionBody}>
          <div style={S.grid2}>
            <div style={S.row}>
              <label style={S.label}>Line 1 — Gross Receipts / Sales ($)</label>
              <input
                style={S.input}
                type="number"
                value={revenue}
                onChange={e => setRevenue(e.target.value)}
                placeholder="0"
              />
            </div>
            <div style={S.row}>
              <label style={S.label}>Line 2 — Returns & Allowances ($)</label>
              <input
                style={S.input}
                type="number"
                value={returns}
                onChange={e => setReturns(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div style={S.divider} />

          <div style={S.resultRow}>
            <span style={{ fontSize: 13, color: "#999" }}>Line 7 — Gross Income (Line 1 − 2)</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#4ade80" }}>{fmt(grossIncome)}</span>
          </div>
        </div>
      </div>

      {/* ── Part II — Expenses ────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHeader}>Part II — Expenses</div>
        <div style={S.sectionBody}>
          <div style={S.grid2}>
            <div style={S.row}>
              <label style={S.label}>Line 8 — Advertising ($)</label>
              <input style={S.input} type="number" value={advertising}
                onChange={e => setAdvertising(e.target.value)} placeholder="0" />
            </div>
            <div style={S.row}>
              <label style={S.label}>Line 10 — Commissions & Fees ($)</label>
              <input style={S.input} type="number" value={commissions}
                onChange={e => setCommissions(e.target.value)} placeholder="0" />
            </div>
            <div style={S.row}>
              <label style={S.label}>Line 15 — Insurance ($)</label>
              <input style={S.input} type="number" value={insurance}
                onChange={e => setInsurance(e.target.value)} placeholder="0" />
            </div>
            <div style={S.row}>
              <label style={S.label}>Line 18 — Office Expense ($)</label>
              <input style={S.input} type="number" value={officeExp}
                onChange={e => setOfficeExp(e.target.value)} placeholder="0" />
            </div>
            <div style={S.row}>
              <label style={S.label}>Line 21 — Repairs & Maintenance ($)</label>
              <input style={S.input} type="number" value={repairs}
                onChange={e => setRepairs(e.target.value)} placeholder="0" />
            </div>
            <div style={S.row}>
              <label style={S.label}>Line 22 — Supplies ($)</label>
              <input style={S.input} type="number" value={supplies}
                onChange={e => setSupplies(e.target.value)} placeholder="0" />
            </div>
            <div style={S.row}>
              <label style={S.label}>Line 23 — Taxes & Licenses ($)</label>
              <input style={S.input} type="number" value={taxes}
                onChange={e => setTaxes(e.target.value)} placeholder="0" />
            </div>
            <div style={S.row}>
              <label style={S.label}>Line 25 — Utilities ($)</label>
              <input style={S.input} type="number" value={utilities}
                onChange={e => setUtilities(e.target.value)} placeholder="0" />
            </div>
            <div style={S.row}>
              <label style={S.label}>Line 26 — Wages ($)</label>
              <input style={S.input} type="number" value={wages}
                onChange={e => setWages(e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Part IV — Vehicle ─────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHeader}>Part IV — Car & Truck (Line 9)</div>
        <div style={S.sectionBody}>
          <div style={{
            display: "flex", gap: 12, marginBottom: 14,
          }}>
            <button
              onClick={() => setUseActualCar(false)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 8, fontSize: 13,
                border: "1px solid " + (!useActualCar ? "#f5a623" : "#1e1e2e"),
                background: !useActualCar ? "rgba(245,166,35,0.1)" : "transparent",
                color: !useActualCar ? "#f5a623" : "#666",
                cursor: "pointer", fontWeight: !useActualCar ? 700 : 400,
              }}
            >
              Standard Mileage Rate<br/>
              <span style={{ fontSize: 11 }}>${MILEAGE_RATE_2024}/mile (IRS 2024)</span>
            </button>
            <button
              onClick={() => setUseActualCar(true)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 8, fontSize: 13,
                border: "1px solid " + (useActualCar ? "#f5a623" : "#1e1e2e"),
                background: useActualCar ? "rgba(245,166,35,0.1)" : "transparent",
                color: useActualCar ? "#f5a623" : "#666",
                cursor: "pointer", fontWeight: useActualCar ? 700 : 400,
              }}
            >
              Actual Expenses<br/>
              <span style={{ fontSize: 11 }}>Receipts required</span>
            </button>
          </div>

          {!useActualCar ? (
            <div style={S.row}>
              <label style={S.label}>
                Business Miles Driven (Line 44a)
              </label>
              <input style={S.input} type="number" value={carMiles}
                onChange={e => setCarMiles(e.target.value)} placeholder="0" />
              <p style={{ fontSize: 11, color: "#f5a623", marginTop: 6 }}>
                → {num(carMiles).toLocaleString()} miles × ${MILEAGE_RATE_2024} = {fmt(carExpense)}
              </p>
            </div>
          ) : (
            <div style={S.row}>
              <label style={S.label}>Actual Car/Truck Expenses ($)</label>
              <input style={S.input} type="number" value={actualCar}
                onChange={e => setActualCar(e.target.value)} placeholder="0" />
            </div>
          )}

          <div style={{ ...S.grid2, marginTop: 10 }}>
            <div style={S.row}>
              <label style={S.label}>Date placed in service (Line 43)</label>
              <input style={S.input} value={vehicleDate}
                onChange={e => setVehicleDate(e.target.value)} />
            </div>
            <div style={{ padding: "10px 0" }}>
              <label style={{ ...S.label, marginBottom: 10 }}>
                Line 47a — Written evidence?
              </label>
              <div style={{ display: "flex", gap: 12 }}>
                {["Yes", "No"].map(opt => (
                  <button key={opt}
                    onClick={() => setWrittenEvid(opt === "Yes")}
                    style={{
                      padding: "6px 16px", borderRadius: 6, fontSize: 12,
                      border: "1px solid " + ((writtenEvid ? "Yes" : "No") === opt ? "#f5a623" : "#1e1e2e"),
                      background: ((writtenEvid ? "Yes" : "No") === opt ? "rgba(245,166,35,0.1)" : "transparent"),
                      color: ((writtenEvid ? "Yes" : "No") === opt ? "#f5a623" : "#666"),
                      cursor: "pointer",
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Part V — Other Expenses ───────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHeader}>Part V — Other Expenses (Line 27a)</div>
        <div style={S.sectionBody}>
          {otherExpenses.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input
                style={{ ...S.input, flex: 2 }}
                value={e.description}
                onChange={ev => setOther(i, "description", ev.target.value)}
                placeholder="Description"
              />
              <input
                style={{ ...S.input, flex: 1 }}
                type="number"
                value={e.amount}
                onChange={ev => setOther(i, "amount", ev.target.value)}
                placeholder="$0"
              />
              <button onClick={() => removeOther(i)}
                style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #1e1e2e",
                  background: "transparent", color: "#666", cursor: "pointer", fontSize: 14 }}>
                ×
              </button>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <button onClick={addOther}
              style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #1e1e2e",
                background: "transparent", color: "#f5a623", fontSize: 12, cursor: "pointer" }}>
              + Add expense
            </button>
            <span style={{ fontSize: 13, color: "#999" }}>
              Total Line 27a: <strong style={{ color: "#f0f0f0" }}>{fmt(otherTotal)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Form 8829 — Home Office (primary only) ───────── */}
      {showHomeOffice && (
        <div style={S.section}>
          <div style={S.sectionHeader}>Form 8829 — Home Office (Line 30)</div>
          <div style={S.sectionBody}>
            <div style={S.grid3}>
              <div style={S.row}>
                <label style={S.label}>Business sq ft (Line 1)</label>
                <input style={S.input} type="number" value={homeBizSqft}
                  onChange={e => setHomeBizSqft(e.target.value)} />
              </div>
              <div style={S.row}>
                <label style={S.label}>Total home sq ft (Line 2)</label>
                <input style={S.input} type="number" value={homeTotalSqft}
                  onChange={e => setHomeTotalSqft(e.target.value)} />
              </div>
              <div style={S.row}>
                <label style={S.label}>Annual Rent ($)</label>
                <input style={S.input} type="number" value={homeRent}
                  onChange={e => setHomeRent(e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 8, padding: "10px 12px", background: "#0d0d1a",
              borderRadius: 8, border: "1px solid #1a1a2e" }}>
              <div style={S.resultRow}>
                <span style={{ fontSize: 12, color: "#666" }}>Business use % (Line 7)</span>
                <span style={{ color: "#f5a623", fontWeight: 600 }}>{(homePct * 100).toFixed(1)}%</span>
              </div>
              <div style={{ ...S.resultRow, borderBottom: "none" }}>
                <span style={{ fontSize: 12, color: "#666" }}>Allowable deduction (Line 36 → Sch C Line 30)</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>{fmt(homeOfficeAllowable)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary (Lines 28–31) ─────────────────────────── */}
      <div style={{
        border: "1px solid #2a2a1e", borderRadius: 12,
        background: "#0d0d0a", padding: "16px 20px",
      }}>
        <p style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Schedule C Summary
        </p>
        {[
          { label: "Line 28 — Total Expenses", val: totalExpenses, color: "#f87171" },
          { label: "Line 29 — Tentative Profit", val: tentativeProfit, color: "#f0f0f0" },
          ...(showHomeOffice ? [{ label: "Line 30 — Home Office (8829)", val: -homeOfficeAllowable, color: "#888" }] : []),
          { label: "Line 31 — Net Profit", val: netProfit, color: netProfit >= 0 ? "#4ade80" : "#f87171", bold: true },
        ].map((r, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between",
            padding: "8px 0", borderBottom: "1px solid #111",
          }}>
            <span style={{ fontSize: 13, color: "#888" }}>{r.label}</span>
            <span style={{ fontSize: 15, fontWeight: (r as any).bold ? 800 : 500, color: r.color }}>
              {r.val < 0 ? `(${fmt(Math.abs(r.val))})` : fmt(r.val)}
            </span>
          </div>
        ))}

        {/* SE Tax preview */}
        <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(245,166,35,0.06)",
          borderRadius: 8, border: "1px solid rgba(245,166,35,0.2)" }}>
          <p style={{ fontSize: 11, color: "#f5a623", fontWeight: 700, marginBottom: 4 }}>
            ⚡ SE Tax Preview (Schedule SE)
          </p>
          <p style={{ fontSize: 12, color: "#888" }}>
            Net profit {fmt(netProfit)} × 92.35% = {fmt(seEarnings)} → SE tax ≈{" "}
            <strong style={{ color: "#f5a623" }}>{fmt(seTax)}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
