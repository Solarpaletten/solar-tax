"use client";
// components/forms/TaxFormsViewer.tsx
// Interactive viewer for all IRS forms with LIVE formulas from calc.ts
// Forms: 8879, 1040, Sch1, Sch2, SchC, SchD, SchSE, 8949, 8995, 8829
// All values computed from real ScenarioResult + incomeItems + expenseItems s

import { useState } from "react";
import { calculate } from "@/lib/tax/calc";

type TaxYear = any;

// ── Money formatting ────────────────────────────────────────────────────────
const fmt  = (n: number) => n === 0 ? "—" : "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
const fmtN = (n: number) => Math.round(n).toLocaleString("en-US");
const pct  = (n: number) => n.toFixed(1) + "%";

// ── Color tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "#fafaf8",
  surface: "#ffffff",
  border:  "#d4d4d0",
  muted:   "#6b6b65",
  blue:    "#1a3a6b",
  red:     "#8b1a1a",
  green:   "#0f5132",
  sun:     "#c45400",
  label:   "#374151",
  value:   "#111827",
};

interface Props {
  taxYear:   TaxYear;
  taxpayers: any[];
}

type FormTab = "8879" | "1040" | "sch1" | "sch2" | "schC" | "schD" | "schSE" | "f8949" | "f8995" | "f8829";

export function TaxFormsViewer({ taxYear, taxpayers }: Props) {
  const [tab, setTab] = useState<FormTab>("8879");

  // ── Derive all inputs from DB data ────────────────────────────────────────
  const scenarios  = taxYear.scenarios ?? [];
  const balanced   = scenarios.find((s: any) => s.type === "BALANCED")?.result
                  ?? scenarios[0]?.result;

  const incomeItems  = taxYear.incomeItems  ?? [];
  const expenseItems = taxYear.expenseItems ?? [];
  const dependents   = taxYear.dependents   ?? [];

  const w2Items  = incomeItems.filter((i: any) => i.type === "W2");
  const seItems  = incomeItems.filter((i: any) => !["W2"].includes(i.type));

  const w2Income    = w2Items.reduce((s: number, i: any) => s + Number(i.amount), 0);
  const w2Wh        = w2Items.reduce((s: number, i: any) => s + Number(i.withholding), 0);
  const n99Wh       = seItems.reduce((s: number, i: any) => s + Number(i.withholding), 0);
  const seGross     = seItems.reduce((s: number, i: any) => s + Number(i.amount), 0);
  const allowedEx   = expenseItems.reduce((s: number, e: any) =>
    s + Number(e.amount) * (e.businessPct / 100), 0);
  const seNetProfit = Math.max(0, seGross - allowedEx);
  const numChildren = dependents.filter((d: any) => {
    const age = new Date().getFullYear() - new Date(d.dateOfBirth).getFullYear();
    return age < 17 && d.months >= 6;
  }).length;

  // ── Run live tax calculation ───────────────────────────────────────────────
  const c = calculate({
    filingStatus:      taxYear.filingStatus ?? "MARRIED_FILING_JOINTLY",
    w2Income,
    seNetProfit,
    w2Withholding:     w2Wh,
    n99Withholding:    n99Wh,
    estimatedPayments: 0,
    numChildren,
  });

  const primary = taxpayers.find((t: any) =>  t.isPrimary) ?? taxpayers[0];
  const spouse  = taxpayers.find((t: any) => !t.isPrimary) ?? null;
  const isMFJ   = taxYear.filingStatus === "MARRIED_FILING_JOINTLY";
  const today   = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Expense breakdown by category
  const expByCategory: Record<string, { entered: number; allowed: number }> = {};
  for (const e of expenseItems) {
    const cat = e.category as string;
    if (!expByCategory[cat]) expByCategory[cat] = { entered: 0, allowed: 0 };
    expByCategory[cat].entered += Number(e.amount);
    expByCategory[cat].allowed += Number(e.amount) * (e.businessPct / 100);
  }

  const tabs: { id: FormTab; label: string; form: string }[] = [
    { id: "8879",  label: "Form 8879",  form: "e-file Auth" },
    { id: "1040",  label: "Form 1040",  form: "Main Return" },
    { id: "sch1",  label: "Schedule 1", form: "Add. Income" },
    { id: "sch2",  label: "Schedule 2", form: "Add. Taxes" },
    { id: "schC",  label: "Schedule C", form: "Business" },
    { id: "schD",  label: "Schedule D", form: "Cap Gains" },
    { id: "schSE", label: "Schedule SE",form: "SE Tax" },
    { id: "f8949", label: "Form 8949",  form: "Cap Assets" },
    { id: "f8995", label: "Form 8995",  form: "QBI Ded." },
    { id: "f8829", label: "Form 8829",  form: "Home Office" },
  ];

  // ── Shared UI primitives ──────────────────────────────────────────────────
  const Line = ({ num, label, value, formula, sub, red, green, bold }: {
    num?: string; label: string; value: number | string; formula?: string;
    sub?: boolean; red?: boolean; green?: boolean; bold?: boolean;
  }) => (
    <div style={{
      display: "flex", alignItems: "baseline",
      padding: sub ? "4px 16px 4px 32px" : "7px 16px",
      borderBottom: `1px solid ${C.border}`,
      background: bold ? "rgba(26,58,107,0.03)" : "transparent",
    }}>
      {num && <span style={{ width: 28, fontSize: 10, fontWeight: 700, color: C.sun, flexShrink: 0 }}>{num}</span>}
      <span style={{ flex: 1, fontSize: sub ? 11 : 12, color: sub ? C.muted : C.label, lineHeight: 1.4 }}>
        {label}
        {formula && <span style={{ marginLeft: 6, fontSize: 9, color: "#9ca3af", fontFamily: "monospace" }}>= {formula}</span>}
      </span>
      <span style={{
        fontSize: bold ? 14 : 12, fontWeight: bold ? 800 : 600,
        color: red ? C.red : green ? C.green : C.value,
        fontFamily: "monospace", minWidth: 80, textAlign: "right",
      }}>
        {typeof value === "number" ? fmt(value) : value}
      </span>
    </div>
  );

  const SectionHead = ({ children }: { children: string }) => (
    <div style={{
      padding: "7px 16px", background: C.blue, color: "#fff",
      fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
    }}>{children}</div>
  );

  const FormCard = ({ title, subtitle, form, year, children }: {
    title: string; subtitle: string; form: string; year?: number; children: React.ReactNode;
  }) => (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ background: C.blue, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>{title}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{subtitle}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{form}</div>
          {year && <div style={{ marginTop: 4, padding: "2px 8px", background: "rgba(196,84,0,0.6)", borderRadius: 4, fontSize: 10, fontWeight: 700, color: "#fff" }}>Tax Year {year}</div>}
        </div>
      </div>
      <div style={{ background: "#f8f7f5" }}>
        {children}
      </div>
    </div>
  );

  const TaxpayerRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ color: C.value, fontWeight: 600 }}>{value}</span>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // FORM RENDERERS
  // ══════════════════════════════════════════════════════════════════════════

  const render8879 = () => (
    <FormCard title="Form 8879" subtitle="IRS e-file Signature Authorization" form="OMB No. 1545-0074" year={taxYear.year}>
      <SectionHead>Taxpayer Information</SectionHead>
      <TaxpayerRow label="Taxpayer" value={primary ? `${primary.firstName} ${primary.lastName}` : "—"} />
      {isMFJ && <TaxpayerRow label="Spouse" value={spouse ? `${spouse.firstName} ${spouse.lastName}` : "—"} />}
      <TaxpayerRow label="Filing Status" value={taxYear.filingStatus?.replace(/_/g, " ")} />
      <TaxpayerRow label="ERO Firm" value="TLNC TRADE LLC · EIN 36-4986102 · Houston, TX" />

      <SectionHead>Part I — Tax Return Information</SectionHead>
      <Line num="1" label="Adjusted gross income" value={c.line11} formula="line9 − line10" bold />
      <Line num="2" label="Total tax" value={c.line24} formula="line22 + line23" red />
      <Line num="3" label="Federal income tax withheld" value={c.line25d} formula="line25a + line25b" />
      <Line num="4" label="Refund" value={c.line34} formula="line33 − line24 (if positive)" green={c.isRefund} />
      <Line num="5" label="Amount you owe" value={c.line37} formula="line24 − line33 (if positive)" red={!c.isRefund} bold />

      <SectionHead>Part II — Certification</SectionHead>
      <div style={{ padding: "12px 16px", fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
        Under penalties of perjury, I declare that I have examined this return and to the best of my knowledge it is true, correct, and complete. I authorize <strong style={{ color: C.value }}>TLNC TRADE LLC</strong> (EIN 36-4986102) to enter or generate my PIN as my electronic signature.
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderTop: `1px solid ${C.border}`, fontSize: 11 }}>
        <span style={{ color: C.muted }}>Date: <strong style={{ color: C.value }}>{today}</strong></span>
        <span style={{ color: c.isRefund ? C.green : C.red, fontWeight: 700 }}>
          {c.isRefund ? `Refund: ${fmt(c.line34)}` : `Amount Due: ${fmt(c.line37)}`}
        </span>
      </div>
    </FormCard>
  );

  const render1040 = () => (
    <FormCard title="Form 1040" subtitle="U.S. Individual Income Tax Return" form="OMB No. 1545-0074" year={taxYear.year}>
      <SectionHead>Taxpayer Info</SectionHead>
      <TaxpayerRow label="Name" value={primary ? `${primary.firstName} ${primary.lastName}` : "—"} />
      {isMFJ && <TaxpayerRow label="Spouse" value={spouse ? `${spouse.firstName} ${spouse.lastName}` : "—"} />}
      <TaxpayerRow label="Filing Status" value={taxYear.filingStatus?.replace(/_/g, " ")} />
      <TaxpayerRow label="Dependents" value={dependents.map((d: any) => d.firstName).join(", ") || "None"} />

      <SectionHead>Income</SectionHead>
      <Line num="1a" label="W-2 wages" value={c.line1a} formula={`sum(incomeItems where type=W2)`} />
      <Line num="7a" label="Capital gain/loss (Sch D)" value={0} />
      <Line num="8"  label="Additional income (Sch 1 Line 10 — SE income)" value={c.line8} formula="seNetProfit" />
      <Line num="9"  label="Total income" value={c.line9} formula="line1a + line8" bold />
      <Line num="10" label="Adjustments (Sch 1 Line 26 — ½ SE tax)" value={c.line10} formula="seTax × 50%" />
      <Line num="11" label="Adjusted Gross Income (AGI)" value={c.line11} formula="line9 − line10" bold />

      <SectionHead>Tax & Credits</SectionHead>
      <Line num="12e" label="Standard deduction" value={c.line12} formula={`${taxYear.filingStatus === "MARRIED_FILING_JOINTLY" ? "$29,200 MFJ" : "$14,600"}`} />
      <Line num="13a" label="QBI deduction (Form 8995)" value={c.line13} formula="min(seProfit×20%, preTax×20%)" />
      <Line num="14"  label="Total deductions" value={c.line14} formula="line12 + line13" />
      <Line num="15"  label="Taxable income" value={c.line15} formula="line11 − line14" bold />
      <Line num="16"  label="Income tax (tax brackets)" value={c.line16} />
      <Line num="17"  label="Sch 2 Line 3 (AMT, etc.)" value={0} />
      <Line num="18"  label="Add lines 16 + 17" value={c.line16} formula="line16 + 0" />
      <Line num="19"  label="Child tax credit" value={c.line19} formula={`${numChildren} children × $2,000`} green={c.line19 > 0} />
      <Line num="22"  label="Tax after credits" value={c.line22} formula="line16 − line19" />
      <Line num="23"  label="SE tax (Sch 2 Line 21)" value={c.line23} formula="Schedule SE Line 12" />
      <Line num="24"  label="Total tax" value={c.line24} formula="line22 + line23" bold red />

      <SectionHead>Payments</SectionHead>
      <Line num="25a" label="W-2 withholding" value={c.line25a} />
      <Line num="25b" label="1099 withholding" value={c.line25b} />
      <Line num="25d" label="Total withholding" value={c.line25d} formula="25a + 25b" />
      <Line num="26"  label="Estimated tax payments" value={c.line26} />
      <Line num="33"  label="Total payments" value={c.line33} formula="25d + 26" bold />

      <SectionHead>Result</SectionHead>
      <Line num="34" label="Refund (line33 > line24)" value={c.line34} formula="line33 − line24" green={c.isRefund} bold />
      <Line num="37" label="Amount owed (line24 > line33)" value={c.line37} formula="line24 − line33" red={!c.isRefund} bold />

      <div style={{ padding: "8px 16px", background: "rgba(26,58,107,0.04)", fontSize: 11 }}>
        <span style={{ color: C.muted }}>Effective Rate: </span>
        <strong style={{ color: C.value }}>{pct(c.effectiveRate)}</strong>
        <span style={{ marginLeft: 16, color: C.muted }}>Total Tax / Total Income</span>
      </div>
    </FormCard>
  );

  const renderSch1 = () => (
    <FormCard title="Schedule 1" subtitle="Additional Income and Adjustments" form="Sequence No. 01" year={taxYear.year}>
      <SectionHead>Part I — Additional Income</SectionHead>
      <Line num="3"  label="Business income (Schedule C net profit)" value={c.line8} formula="seGross − allowedExpenses" bold />
      <Line num="9"  label="Total other income" value={0} />
      <Line num="10" label="Combine lines 1–9 → Form 1040 Line 8" value={c.line8} formula="= Schedule C Line 31" bold />

      <SectionHead>Part II — Adjustments to Income</SectionHead>
      <Line num="15" label="Deductible part of SE tax (50%)" value={c.seDeductible} formula="SE tax × 50%" />
      <Line num="26" label="Total adjustments → Form 1040 Line 10" value={c.line10} formula="= line15" bold />

      <div style={{ padding: "10px 16px", fontSize: 11, color: C.muted }}>
        Note: SE income flows here from Schedule C Line 31. The ½ SE tax deduction reduces AGI.
      </div>
    </FormCard>
  );

  const renderSch2 = () => (
    <FormCard title="Schedule 2" subtitle="Additional Taxes" form="Sequence No. 02" year={taxYear.year}>
      <SectionHead>Part I — Tax</SectionHead>
      <Line num="1z" label="Additions to tax" value={0} />
      <Line num="2"  label="Alternative minimum tax" value={0} />
      <Line num="3"  label="Total → Form 1040 Line 17" value={0} formula="AMT (not applicable)" />

      <SectionHead>Part II — Other Taxes</SectionHead>
      <Line num="4"  label="Self-employment tax (Schedule SE Line 12)" value={c.seTax} formula="SE earnings × 15.3%" bold red />
      <Line num="21" label="Total other taxes → Form 1040 Line 23" value={c.line23} formula="= line4 (SE tax)" bold />

      <div style={{ padding: "10px 16px", fontSize: 11, color: C.muted }}>
        SE tax = Social Security (12.4%) + Medicare (2.9%) on 92.35% of net profit.
      </div>
    </FormCard>
  );

  const renderSchC = () => (
    <FormCard title="Schedule C" subtitle="Profit or Loss From Business (Sole Proprietorship)" form="Sequence No. 09" year={taxYear.year}>
      <SectionHead>Part I — Income</SectionHead>
      {seItems.map((i: any, idx: number) => (
        <Line key={idx} num="1" label={`Gross receipts — ${i.source}`} value={Number(i.amount)} />
      ))}
      <Line num="7"  label="Gross income (total SE receipts)" value={seGross} formula="sum(SE income items)" bold />

      <SectionHead>Part II — Expenses</SectionHead>
      {expenseItems.map((e: any, idx: number) => (
        <div key={idx} style={{ display: "flex", alignItems: "baseline", padding: "5px 16px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ width: 28, fontSize: 10, color: C.muted }}>{idx + 8}</span>
          <span style={{ flex: 1, fontSize: 11, color: C.label }}>{e.description}</span>
          <span style={{ fontSize: 10, color: C.muted, marginRight: 12 }}>{e.businessPct}%</span>
          <span style={{ fontSize: 11, color: C.muted, width: 70, textAlign: "right" }}>{fmt(Number(e.amount))}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.green, width: 80, textAlign: "right" }}>
            {fmt(Number(e.amount) * e.businessPct / 100)}
          </span>
        </div>
      ))}
      <div style={{ display: "flex", padding: "6px 16px 6px 44px", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700 }}>
        <span style={{ flex: 1, color: C.label }}>Total expenses</span>
        <span style={{ width: 70, textAlign: "right", color: C.muted }}>{fmt(expenseItems.reduce((s: number, e: any) => s + Number(e.amount), 0))}</span>
        <span style={{ width: 80, textAlign: "right", color: C.green }}>{fmt(allowedEx)}</span>
      </div>

      <SectionHead>Result</SectionHead>
      <Line num="28" label="Total expenses" value={allowedEx} />
      <Line num="29" label="Tentative profit (gross − expenses)" value={seGross - allowedEx} formula="seGross − allowedExpenses" />
      <Line num="30" label="Form 8829 home office (if applicable)" value={0} />
      <Line num="31" label="Net profit → Schedule 1 Line 3" value={seNetProfit} formula="line29 − line30" bold green={seNetProfit > 0} />
    </FormCard>
  );

  const renderSchD = () => (
    <FormCard title="Schedule D" subtitle="Capital Gains and Losses" form="Sequence No. 12" year={taxYear.year}>
      <SectionHead>Part I — Short-Term (≤1 year)</SectionHead>
      <Line num="1b" label="Box A transactions (basis reported to IRS)" value={0} />
      <Line num="7"  label="Net short-term capital gain or (loss)" value={0} />

      <SectionHead>Part II — Long-Term (>1 year)</SectionHead>
      <Line num="15" label="Net long-term capital gain or (loss)" value={0} />

      <SectionHead>Part III — Summary</SectionHead>
      <Line num="16" label="Combine lines 7 and 15 → Form 1040 Line 7a" value={0} />

      <div style={{ padding: "10px 16px", fontSize: 11, color: C.muted }}>
        No capital gain/loss transactions recorded for this tax year. Add brokerage 1099-B data to populate.
      </div>
    </FormCard>
  );

  const seEarnings  = seNetProfit * 0.9235;
  const ssSsTax     = Math.min(seEarnings, 168600) * 0.124;
  const medTax      = seEarnings * 0.029;

  const renderSchSE = () => (
    <FormCard title="Schedule SE" subtitle="Self-Employment Tax" form="Sequence No. 17" year={taxYear.year}>
      <SectionHead>Part I — Self-Employment Tax</SectionHead>
      <Line num="2"  label="Net profit from Schedule C Line 31" value={seNetProfit} />
      <Line num="3"  label="Combine lines 1a, 1b, and 2" value={seNetProfit} />
      <Line num="4a" label="SE earnings (line3 × 92.35%)" value={seEarnings} formula={`${fmtN(seNetProfit)} × 0.9235`} />
      <Line num="10" label="Social Security tax (×12.4%, cap $168,600)" value={ssSsTax} formula="min(seEarnings, 168600) × 12.4%" />
      <Line num="11" label="Medicare tax (×2.9%)" value={medTax} formula="seEarnings × 2.9%" />
      <Line num="12" label="SE tax → Schedule 2 Line 4" value={c.seTax} formula="SS + Medicare" bold red />
      <Line num="13" label="Deduction (50%) → Schedule 1 Line 15" value={c.seDeductible} formula="line12 × 50%" bold green />
    </FormCard>
  );

  const render8949 = () => (
    <FormCard title="Form 8949" subtitle="Sales and Other Dispositions of Capital Assets" form="Sequence No. 12A" year={taxYear.year}>
      <SectionHead>Part I — Short-Term Transactions (Box A)</SectionHead>
      <div style={{ padding: "12px 16px", fontSize: 11, color: C.muted }}>
        No transactions recorded. Import from brokerage 1099-B to populate Form 8949.
      </div>
      <div style={{ display: "flex", fontWeight: 700, padding: "6px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.label }}>
        <span style={{ flex: 1 }}>Description</span>
        <span style={{ width: 80, textAlign: "right" }}>Proceeds</span>
        <span style={{ width: 80, textAlign: "right" }}>Cost Basis</span>
        <span style={{ width: 80, textAlign: "right" }}>Gain/(Loss)</span>
      </div>
      <Line num="2" label="Totals → Schedule D Line 1b" value={0} />
    </FormCard>
  );

  const qbiBase   = seNetProfit;
  const qbi20     = qbiBase * 0.20;
  const preTaxable = Math.max(0, c.line11 - c.line12);
  const incLim    = preTaxable * 0.20;
  const qbiDed    = Math.min(qbi20, incLim);

  const render8995 = () => (
    <FormCard title="Form 8995" subtitle="Qualified Business Income Deduction — Simplified Computation" form="Sequence No. 55" year={taxYear.year}>
      <SectionHead>Calculation</SectionHead>
      <div style={{ padding: "5px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 11 }}>
        <div style={{ display: "flex", marginBottom: 4 }}>
          <span style={{ flex: 1, color: C.muted }}>Business name</span>
          <span style={{ color: C.value }}>{taxYear.household?.name ?? "Self-Employment Business"}</span>
        </div>
      </div>
      <Line num="1"  label="Qualified business income from Schedule C" value={qbiBase} />
      <Line num="2"  label="Total QBI (combine lines 1i–1v)" value={qbiBase} />
      <Line num="4"  label="Total qualified business income" value={qbiBase} />
      <Line num="5"  label="QBI component (×20%)" value={qbi20} formula="line4 × 20%" />
      <Line num="10" label="QBI deduction before income limitation" value={qbi20} />
      <Line num="11" label="Taxable income before QBI deduction" value={c.line15 + qbiDed} />
      <Line num="13" label="Subtract net capital gain" value={c.line15 + qbiDed} />
      <Line num="14" label="Income limitation (×20%)" value={incLim} formula="line13 × 20%" />
      <Line num="15" label="QBI deduction → Form 1040 Line 13a" value={qbiDed} formula="min(line10, line14)" bold green={qbiDed > 0} />
    </FormCard>
  );

  // Form 8829 — home office
  const homeOfficeItem = expenseItems.find((e: any) =>
    e.category === "HOME_OFFICE" || e.description?.toLowerCase().includes("home") || e.description?.toLowerCase().includes("studio")
  );
  const homeOfficeAmt  = homeOfficeItem ? Number(homeOfficeItem.amount) * homeOfficeItem.businessPct / 100 : 0;

  const render8829 = () => (
    <FormCard title="Form 8829" subtitle="Expenses for Business Use of Your Home" form="Sequence No. 176" year={taxYear.year}>
      <SectionHead>Part I — Part of Home Used for Business</SectionHead>
      {homeOfficeItem ? (
        <>
          <Line num="1" label="Business use area (sq ft)" value={homeOfficeItem.description ?? "Home Office"} />
          <Line num="7" label="Business use %" value={`${homeOfficeItem.businessPct}%`} />
        </>
      ) : (
        <div style={{ padding: "10px 16px", fontSize: 11, color: C.muted }}>
          No HOME_OFFICE expense found. Add a home office expense to populate Form 8829.
        </div>
      )}

      <SectionHead>Part II — Allowable Deduction</SectionHead>
      {homeOfficeItem && (
        <>
          <Line num="19" label="Rent (indirect expense)" value={Number(homeOfficeItem.amount)} />
          <Line num="23" label="Total indirect expenses" value={Number(homeOfficeItem.amount)} />
          <Line num="24" label="Multiply by business use %" value={homeOfficeAmt} formula={`${fmtN(Number(homeOfficeItem.amount))} × ${homeOfficeItem.businessPct}%`} />
          <Line num="36" label="Allowable home office expense → Schedule C Line 30" value={homeOfficeAmt} formula="line24" bold green />
        </>
      )}
    </FormCard>
  );

  const renderForm = () => {
    switch (tab) {
      case "8879":  return render8879();
      case "1040":  return render1040();
      case "sch1":  return renderSch1();
      case "sch2":  return renderSch2();
      case "schC":  return renderSchC();
      case "schD":  return renderSchD();
      case "schSE": return renderSchSE();
      case "f8949": return render8949();
      case "f8995": return render8995();
      case "f8829": return render8829();
    }
  };

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: C.bg, minHeight: "100vh" }}>

      {/* Summary banner */}
      <div style={{ background: C.blue, padding: "12px 24px", display: "flex", gap: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total Income",  val: fmt(c.line9),   sub: "Line 9" },
          { label: "AGI",           val: fmt(c.line11),  sub: "Line 11" },
          { label: "Taxable Income",val: fmt(c.line15),  sub: "Line 15" },
          { label: "Total Tax",     val: fmt(c.line24),  sub: "Line 24", red: true },
          { label: "Withholding",   val: fmt(c.line25d), sub: "Line 25d" },
          { label: c.isRefund ? "Refund" : "Amount Due",
            val: c.isRefund ? fmt(c.line34) : fmt(c.line37),
            sub: c.isRefund ? "Line 34" : "Line 37",
            green: c.isRefund, red: !c.isRefund },
          { label: "Eff. Rate",     val: pct(c.effectiveRate), sub: "Tax/Income" },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: s.red ? "#fca5a5" : s.green ? "#86efac" : "#fff" }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{s.label} · {s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", overflowX: "auto", borderBottom: `2px solid ${C.border}`, background: C.surface, padding: "0 16px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 14px", border: "none", background: "transparent",
            borderBottom: tab === t.id ? `3px solid ${C.blue}` : "3px solid transparent",
            cursor: "pointer", whiteSpace: "nowrap",
            fontSize: 11, fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? C.blue : C.muted,
            marginBottom: -2,
          }}>
            <div>{t.label}</div>
            <div style={{ fontSize: 9, color: "#9ca3af" }}>{t.form}</div>
          </button>
        ))}
      </div>

      {/* Form content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 60px" }}>
        <div style={{ marginBottom: 12, fontSize: 10, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ background: C.sun, color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700 }}>LIVE</span>
          All values computed in real-time from your income, expense, and dependent data using IRS formulas.
        </div>
        {renderForm()}
      </div>
    </div>
  );
}
