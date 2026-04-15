// app/tax-year/[id]/wizard/[step]/page.tsx s
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getTaxYearFull } from "@/actions/tax-year";
import { STEP_IDS } from "@/lib/wizard/steps";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { Sign8879Screen }   from "@/components/submit/Sign8879Screen";
import { Form1040Input }    from "@/components/workspace/Form1040Input";
import { WizardReviewScreen } from "@/components/wizard/WizardReviewScreen";
import { ScheduleCForm }    from "@/components/wizard/forms/ScheduleCForm";
import { IrsFormStep }      from "@/components/wizard/IrsFormStep";
import { calculate }        from "@/lib/tax/calc";

export default async function WizardStepPage({ params }: { params: { id: string; step: string } }) {
  const { id, step } = params;
  if (!STEP_IDS.includes(step)) return notFound();

  const taxYear = await getTaxYearFull(id);
  if (!taxYear) return notFound();

  const validationData: Record<string, unknown> = {
    signed8879:  (taxYear as any).signed8879 ?? false,
    hasIncome:   taxYear.incomeItems.length > 0,
    hasExpenses: taxYear.expenseItems.length > 0,
  };

  let taxpayers: any[] = [];
  if (step === "sign") {
    const { prisma, ensureSchema } = await import("@/lib/db/client");
    await ensureSchema();
    taxpayers = await prisma.taxpayer.findMany({
      where:   { householdId: taxYear.householdId },
      orderBy: { isPrimary: "desc" },
    });
  }

  // ── Live calculation from real DB data ───────────────────────────────────
  const incomeItems  = taxYear.incomeItems  ?? [];
  const expenseItems = taxYear.expenseItems ?? [];
  const dependents   = taxYear.dependents   ?? [];

  const w2Items  = incomeItems.filter((i: any) => i.type === "W2");
  const seItems  = incomeItems.filter((i: any) => i.type !== "W2");
  const w2Income = w2Items.reduce((s: number, i: any) => s + Number(i.amount), 0);
  const w2Wh     = w2Items.reduce((s: number, i: any) => s + Number(i.withholding), 0);
  const n99Wh    = seItems.reduce((s: number, i: any) => s + Number(i.withholding), 0);
  const seGross  = seItems.reduce((s: number, i: any) => s + Number(i.amount), 0);
  const allowedEx = expenseItems.reduce(
    (s: number, e: any) => s + Number(e.amount) * (e.businessPct / 100), 0
  );
  const seNetProfit = Math.max(0, seGross - allowedEx);
  const numChildren = dependents.filter((d: any) => {
    const age = new Date().getFullYear() - new Date(d.dateOfBirth).getFullYear();
    return age < 17 && d.months >= 6;
  }).length;

  const c = calculate({
    filingStatus:      taxYear.filingStatus ?? "MARRIED_FILING_JOINTLY",
    w2Income, seNetProfit,
    w2Withholding: w2Wh, n99Withholding: n99Wh,
    estimatedPayments: 0, numChildren,
  });

  const fmt = (n: number) => "$" + Math.abs(Math.round(n)).toLocaleString("en-US");

  function renderStep() {
    switch (step) {

      case "sign":
        return <Sign8879Screen taxYear={taxYear} taxpayers={taxpayers} wizardMode />;

      case "form1040":
        return <Form1040Input taxYear={taxYear} />;

      // ── Schedule 1 ──────────────────────────────────────────────────────
      case "schedule1":
        return (
          <IrsFormStep
            formNumber="Schedule 1 (Form 1040)"
            title="Additional Income and Adjustments"
            year={taxYear.year}
            partI={{
              title: "Part I — Additional Income",
              lines: [
                { num: "3",  label: "Business income or (loss) — Attach Schedule C", value: fmt(c.line8),  formula: "Schedule C Line 31", bold: true },
                { num: "9",  label: "Total other income",                              value: "$0" },
                { num: "10", label: "Combine lines 1–9 → enters Form 1040 Line 8",    value: fmt(c.line8),  formula: "= line 3", bold: true, highlight: true },
              ]
            }}
            partII={{
              title: "Part II — Adjustments to Income",
              lines: [
                { num: "15", label: "Deductible part of self-employment tax",          value: fmt(c.seDeductible), formula: "SE tax × 50%" },
                { num: "26", label: "Total adjustments → Form 1040 Line 10",           value: fmt(c.line10), formula: "= line 15", bold: true, highlight: true },
              ]
            }}
            summary={[
              { label: "SE income → 1040 Line 8", value: fmt(c.line8), color: "green" },
              { label: "½ SE deduction → 1040 Line 10", value: fmt(c.seDeductible), color: "blue" },
            ]}
          />
        );

      // ── Schedule 2 ──────────────────────────────────────────────────────
      case "schedule2":
        return (
          <IrsFormStep
            formNumber="Schedule 2 (Form 1040)"
            title="Additional Taxes"
            year={taxYear.year}
            partI={{
              title: "Part I — Tax",
              lines: [
                { num: "1z", label: "Additions to tax (AMT, etc.)",   value: "$0" },
                { num: "2",  label: "Alternative minimum tax",        value: "$0" },
                { num: "3",  label: "Total → Form 1040 Line 17",      value: "$0", bold: true },
              ]
            }}
            partII={{
              title: "Part II — Other Taxes",
              lines: [
                { num: "4",  label: "Self-employment tax — Attach Schedule SE", value: fmt(c.seTax), formula: "SS 12.4% + Medicare 2.9%", bold: true, red: true },
                { num: "21", label: "Total other taxes → Form 1040 Line 23",    value: fmt(c.line23), formula: "= line 4 (SE tax)", bold: true, highlight: true },
              ]
            }}
            note="SE tax = 15.3% on 92.35% of net profit. Split: 12.4% Social Security + 2.9% Medicare."
            summary={[
              { label: "SE tax → 1040 Line 23", value: fmt(c.seTax), color: "red" },
            ]}
          />
        );

      // ── Schedule C ──────────────────────────────────────────────────────
      case "scheduleC":
        return (
          <div>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
              Business income flows from your income items. Expenses reduce net profit.
              Net profit → Schedule 1 Line 3 → Form 1040 Line 8.
            </p>
            <ScheduleCForm mode="primary" taxYearId={id} />
            <div style={{ height: 24 }} />
            <ScheduleCForm mode="spouse" taxYearId={id} />
          </div>
        );

      // ── Schedule D ──────────────────────────────────────────────────────
      case "scheduleD":
        return (
          <IrsFormStep
            formNumber="Schedule D (Form 1040)"
            title="Capital Gains and Losses"
            year={taxYear.year}
            partI={{
              title: "Part I — Short-Term Capital Gains and Losses (Assets Held ≤ 1 Year)",
              lines: [
                { num: "1b", label: "Box A — basis reported to IRS (Form 8949)", value: "$0" },
                { num: "7",  label: "Net short-term capital gain or (loss)",      value: "$0", bold: true },
              ]
            }}
            partII={{
              title: "Part II — Long-Term Capital Gains and Losses (Assets Held > 1 Year)",
              lines: [
                { num: "8b", label: "Box D — basis reported to IRS (Form 8949)", value: "$0" },
                { num: "15", label: "Net long-term capital gain or (loss)",       value: "$0", bold: true },
              ]
            }}
            partIII={{
              title: "Part III — Summary",
              lines: [
                { num: "16", label: "Combine lines 7 and 15 → Form 1040 Line 7a", value: "$0", bold: true, highlight: true },
              ]
            }}
            note="No capital gain/loss transactions recorded. Import brokerage 1099-B to populate."
            summary={[
              { label: "Capital gain → 1040 Line 7a", value: "$0", color: "muted" },
            ]}
          />
        );

      // ── Schedule SE ─────────────────────────────────────────────────────
      case "scheduleSE": {
        const seEarnings = seNetProfit * 0.9235;
        const ssTax  = Math.min(seEarnings, 168600) * 0.124;
        const medTax = seEarnings * 0.029;
        return (
          <IrsFormStep
            formNumber="Schedule SE (Form 1040)"
            title="Self-Employment Tax"
            year={taxYear.year}
            partI={{
              title: "Part I — Self-Employment Tax",
              lines: [
                { num: "2",  label: "Net profit from Schedule C Line 31",            value: fmt(seNetProfit) },
                { num: "3",  label: "Combine lines",                                 value: fmt(seNetProfit) },
                { num: "4a", label: "Multiply by 92.35% (SE earnings)",             value: fmt(seEarnings), formula: `${fmt(seNetProfit)} × 0.9235` },
                { num: "10", label: "Social Security tax (×12.4%, cap $168,600)",   value: fmt(ssTax),       formula: "min(seEarnings, 168600) × 12.4%" },
                { num: "11", label: "Medicare tax (×2.9%)",                         value: fmt(medTax),      formula: "seEarnings × 2.9%" },
                { num: "12", label: "Self-employment tax → Schedule 2 Line 4",      value: fmt(c.seTax),     formula: "SS + Medicare", bold: true, red: true, highlight: true },
                { num: "13", label: "Deduction (50%) → Schedule 1 Line 15",         value: fmt(c.seDeductible), formula: "line12 × 50%", bold: true },
              ]
            }}
            summary={[
              { label: "SE tax → Sch 2 Line 4", value: fmt(c.seTax), color: "red" },
              { label: "½ Deduction → Sch 1 Line 15", value: fmt(c.seDeductible), color: "green" },
            ]}
          />
        );
      }

      // ── Form 8949 ────────────────────────────────────────────────────────
      case "form8949":
        return (
          <IrsFormStep
            formNumber="Form 8949 (2025)"
            title="Sales and Other Dispositions of Capital Assets"
            year={taxYear.year}
            partI={{
              title: "Part I — Short-Term Transactions (Box A — basis reported to IRS)",
              lines: [
                { num: "—", label: "No transactions recorded for this tax year", value: "" },
                { num: "2", label: "Totals → Schedule D Line 1b", value: "$0", bold: true, highlight: true },
              ]
            }}
            partII={{
              title: "Part II — Long-Term Transactions",
              lines: [
                { num: "2", label: "Totals → Schedule D Line 8b", value: "$0", bold: true },
              ]
            }}
            note="Import your broker's 1099-B (Robinhood, Fidelity, etc.) to populate transactions. Box A = basis reported to IRS."
            summary={[
              { label: "Total gain/loss → Schedule D", value: "$0", color: "muted" },
            ]}
          />
        );

      // ── Form 8995 ────────────────────────────────────────────────────────
      case "form8995": {
        const qbi20  = seNetProfit * 0.20;
        const preT   = Math.max(0, c.line11 - c.line12);
        const incLim = preT * 0.20;
        const qbiDed = Math.min(qbi20, incLim);
        return (
          <IrsFormStep
            formNumber="Form 8995 (2025)"
            title="Qualified Business Income Deduction — Simplified Computation"
            year={taxYear.year}
            partI={{
              title: "Calculation",
              lines: [
                { num: "1i", label: `QBI — ${taxYear.household?.name ?? "Business"}`, value: fmt(seNetProfit) },
                { num: "2",  label: "Total qualified business income",                 value: fmt(seNetProfit) },
                { num: "4",  label: "Total QBI (after carryforward)",                  value: fmt(seNetProfit) },
                { num: "5",  label: "QBI component (×20%)",                            value: fmt(qbi20), formula: `${fmt(seNetProfit)} × 20%` },
                { num: "10", label: "QBI deduction before income limitation",          value: fmt(qbi20) },
                { num: "11", label: "Taxable income before QBI deduction",             value: fmt(c.line15 + qbiDed) },
                { num: "13", label: "Net of capital gains",                            value: fmt(c.line15 + qbiDed) },
                { num: "14", label: "Income limitation (×20%)",                       value: fmt(incLim), formula: "line13 × 20%" },
                { num: "15", label: "QBI deduction → Form 1040 Line 13a",             value: fmt(qbiDed), formula: "min(line10, line14)", bold: true, highlight: true, green: true },
              ]
            }}
            summary={[
              { label: "QBI deduction → 1040 Line 13a", value: fmt(qbiDed), color: qbiDed > 0 ? "green" : "muted" },
              { label: "Income limitation applied", value: incLim < qbi20 ? "Yes" : "No" },
            ]}
          />
        );
      }

      // ── Form 8829 ────────────────────────────────────────────────────────
      case "form8829": {
        const hoItem = expenseItems.find((e: any) =>
          e.category === "HOME_OFFICE" || (e.description ?? "").toLowerCase().includes("home") || (e.description ?? "").toLowerCase().includes("studio")
        );
        const hoGross   = hoItem ? Number(hoItem.amount) : 0;
        const hoPct     = hoItem ? hoItem.businessPct : 0;
        const hoAllowed = hoGross * hoPct / 100;
        return (
          <IrsFormStep
            formNumber="Form 8829 (2025)"
            title="Expenses for Business Use of Your Home"
            year={taxYear.year}
            partI={{
              title: "Part I — Part of Your Home Used for Business",
              lines: [
                { num: "1", label: "Area used for business (sq ft)", value: hoItem ? `${hoPct}% of home` : "Not set" },
                { num: "7", label: "Business percentage",             value: `${hoPct}%` },
              ]
            }}
            partII={{
              title: "Part II — Allowable Deduction",
              lines: [
                { num: "8",  label: "Schedule C tentative profit",         value: fmt(seNetProfit) },
                { num: "19", label: "Rent (indirect expense)",             value: fmt(hoGross) },
                { num: "23", label: "Total indirect expenses",             value: fmt(hoGross) },
                { num: "24", label: `Multiply by ${hoPct}%`,              value: fmt(hoAllowed), formula: `${fmt(hoGross)} × ${hoPct}%` },
                { num: "36", label: "Allowable home office → Schedule C Line 30", value: fmt(hoAllowed), bold: true, highlight: true, green: true },
              ]
            }}
            note={hoItem ? `Home office: ${hoItem.description} · ${hoPct}% business use` : "Add a HOME_OFFICE expense to populate this form."}
            summary={[
              { label: "Home office deduction → Sch C Line 30", value: fmt(hoAllowed), color: "green" },
            ]}
          />
        );
      }

      case "review":
        return <WizardReviewScreen taxYear={taxYear} taxYearId={id} />;

      default:
        return notFound();
    }
  }

  return (
    <WizardLayout taxYearId={id} stepId={step} data={validationData}>
      {renderStep()}
    </WizardLayout>
  );
}
