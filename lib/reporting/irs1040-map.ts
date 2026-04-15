// lib/reporting/irs1040-map.ts
// Maps internal ScenarioResult + TaxYear data → IRS 1040 line items
// Deterministic — no AI, no estimation.

import type { IRS1040Report, ReportIncomeItem, ReportExpenseItem, ReportDependent } from "./types";
import { calculate } from "@/lib/tax/calc";
import { filingStatusLabel } from "./format";

function cents(val: string | undefined): number {
  return parseFloat(val ?? "0") || 0;
}

function fmt(n: number): string {
  return Math.round(n).toString();
}

export function buildIRS1040Report(input: {
  taxYear:        any;
  bestScenario:   any;
  scenarioResult: any;
  overrides?: {
    line1a?:  number;
    line8?:   number;
    line25a?: number;
    line25b?: number;
    line26?:  number;
  };
}): IRS1040Report {
  const { taxYear, bestScenario, scenarioResult: r, overrides: ov = {} } = input;

  const grossIncome      = cents(r.grossIncome);
  const allowedExpenses  = cents(r.allowedExpenses);
  const netProfit        = cents(r.netProfit);
  const seTax            = cents(r.seTax);
  const deductibleSEhalf = cents(r.deductibleSEhalf);
  const agi              = cents(r.agi);
  const standardDed      = cents(r.standardDeduction);
  const taxableIncome    = cents(r.taxableIncome);
  const childTaxCredit   = cents(r.childTaxCredit);
  const totalCredits     = cents(r.totalCredits);
  const taxOwed          = cents(r.taxOwed);
  const totalWithholding = cents(r.totalWithholding);
  const refund           = cents(r.refundAmount);
  const amountDue        = cents(r.amountDue);

  // W-2 income — override or from items
  const w2Income = ov.line1a !== undefined ? ov.line1a :
    (taxYear.incomeItems ?? [])
      .filter((i: any) => i.type === "W2")
      .reduce((sum: number, i: any) => sum + cents(i.amount), 0);

  // SE income — override or from engine
  const seNetProfit = ov.line8 !== undefined ? ov.line8 :
    (netProfit > 0 ? netProfit : cents(r.grossIncome) - w2Income);

  // Withholding — overrides or from items
  const w2Withholding = ov.line25a !== undefined ? ov.line25a :
    (taxYear.incomeItems ?? [])
      .filter((i: any) => i.type === "W2")
      .reduce((sum: number, i: any) => sum + cents(i.withholding), 0);
  const n99Withholding = ov.line25b !== undefined ? ov.line25b :
    (taxYear.incomeItems ?? [])
      .filter((i: any) => i.type !== "W2")
      .reduce((sum: number, i: any) => sum + cents(i.withholding), 0);
  const estimatedPayments = ov.line26 ?? 0;

  // ── Run shared tax engine (same as UI — single source of truth) ────────────
  const numChildren = (taxYear.dependents ?? []).length;
  const shared = calculate({
    filingStatus:      taxYear.filingStatus ?? "SINGLE",
    w2Income,
    seNetProfit,
    w2Withholding,
    n99Withholding,
    estimatedPayments,
    numChildren,
    standardDedOverride: standardDed > 0 ? standardDed : undefined,
  });

  // Map shared results → IRS line strings
  const line1a  = shared.line1a  > 0 ? fmt(shared.line1a)  : undefined;
  const line8   = shared.line8   > 0 ? fmt(shared.line8)   : undefined;
  const line9   = fmt(shared.line9);
  const line10  = shared.line10  > 0 ? fmt(shared.line10)  : undefined;
  const line11  = fmt(shared.line11);
  const line12  = fmt(shared.line12);
  const line13  = shared.line13  > 0 ? fmt(shared.line13)  : undefined;
  const line14  = fmt(shared.line14);
  const line15  = fmt(shared.line15);
  const line16  = fmt(shared.line16);
  const line18  = fmt(shared.line16); // Schedule 2 = 0 for now
  const line19  = shared.line19  > 0 ? fmt(shared.line19)  : undefined;
  const line22  = fmt(shared.line22);
  const line23  = shared.line23  > 0 ? fmt(shared.line23)  : undefined;
  const line24  = fmt(shared.line24);
  const line25d = shared.line25d > 0 ? fmt(shared.line25d) : undefined;
  const line33  = fmt(shared.line33);
  const line34  = shared.line34  > 0 ? fmt(shared.line34)  : undefined;
  const line35a = shared.line34  > 0 ? fmt(shared.line34)  : undefined;
  const line37  = shared.line37  > 0 ? fmt(shared.line37)  : undefined;
  // Taxpayer names from Taxpayer records
  const taxpayers = taxYear.household?.taxpayers ?? [];
  const primaryTaxpayer = taxpayers.find((t: any) => t.isPrimary) ?? taxpayers[0];
  const spouseTaxpayer  = taxpayers.find((t: any) => !t.isPrimary) ?? null;
  const taxpayerName = primaryTaxpayer
    ? `${primaryTaxpayer.firstName} ${primaryTaxpayer.lastName}`
    : (taxYear.household?.name ?? "Taxpayer");
  const spouseName = spouseTaxpayer
    ? `${spouseTaxpayer.firstName} ${spouseTaxpayer.lastName}`
    : undefined;
  const incomeItems: ReportIncomeItem[] = (taxYear.incomeItems ?? []).map((i: any) => ({
    type:        i.type,
    source:      i.source,
    amount:      i.amount,
    withholding: i.withholding ?? "0",
  }));

  const expenseItems: ReportExpenseItem[] = (taxYear.expenseItems ?? []).map((e: any) => ({
    category:    e.category,
    description: e.description,
    amount:      e.amount,
    businessPct: e.businessPct,
    allowed:     fmt(cents(e.amount) * e.businessPct / 100),
  }));

  const dependents: ReportDependent[] = (taxYear.dependents ?? []).map((d: any) => ({
    firstName:    d.firstName,
    lastName:     d.lastName,
    relationship: d.relationship,
    months:       d.months,
  }));

  const household = taxYear.household;

  return {
    taxYear:       taxYear.year,
    filingStatus:  filingStatusLabel(taxYear.filingStatus),
    taxpayerName,
    spouseName,

    line1a,
    line8,
    line9,
    line10,
    line11,
    line12,
    line13,
    line14,
    line15,
    line16,
    line18,
    line19,
    line22,
    line23,
    line24,
    line25d: shared.line25d > 0 ? fmt(shared.line25d) : undefined,
    line25a: shared.line25a > 0 ? fmt(shared.line25a) : undefined,
    line25b: shared.line25b > 0 ? fmt(shared.line25b) : undefined,
    line26:  estimatedPayments > 0 ? fmt(estimatedPayments) : undefined,
    line33:  fmt(shared.line33),
    line34,
    line35a,
    line37,

    generatedAt:  new Date().toISOString(),
    scenarioUsed: bestScenario?.name ?? "Balanced",
    notes: [
      "Generated by Solar Tax Engine — for planning purposes only.",
      "Consult a licensed tax professional before filing.",
    ],

    incomeItems,
    expenseItems,
    dependents,
  };
}
