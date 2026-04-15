// lib/tax/calc.ts
// Solar Tax Engine — Single source of truth for all 1040 math
// Extended: multi-Schedule-C, capital gains, full source map s

// ── IRS 2024 Tax Brackets ─────────────────────────────────────────────────────
const BRACKETS: Record<string, Array<[number, number]>> = {
  MARRIED_FILING_JOINTLY:    [[23200,0.10],[94300,0.12],[201050,0.22],[383900,0.24],[487450,0.32],[731200,0.35],[Infinity,0.37]],
  SINGLE:                    [[11600,0.10],[47150,0.12],[100525,0.22],[191950,0.24],[243725,0.32],[365600,0.35],[Infinity,0.37]],
  HEAD_OF_HOUSEHOLD:         [[16550,0.10],[63100,0.12],[100500,0.22],[191950,0.24],[243700,0.32],[365600,0.35],[Infinity,0.37]],
  MARRIED_FILING_SEPARATELY: [[11600,0.10],[47150,0.12],[100525,0.22],[191950,0.24],[243725,0.32],[365600,0.35],[Infinity,0.37]],
};

const STANDARD_DEDUCTIONS: Record<string, number> = {
  MARRIED_FILING_JOINTLY:    29200,
  SINGLE:                    14600,
  HEAD_OF_HOUSEHOLD:         21900,
  MARRIED_FILING_SEPARATELY: 14600,
};

const CTC_PER_CHILD       = 2000;
const CTC_PHASE_OUT_MFJ   = 400000;
const CTC_PHASE_OUT_SINGLE = 200000;
const SS_WAGE_BASE_2024   = 168600;

// ── Schedule C per taxpayer ───────────────────────────────────────────────────
export interface ScheduleCEntry {
  name:      string;   // e.g. "Primary" / "Spouse"
  grossRevenue: number;
  allowedExpenses: number;
  // computed:
  netProfit?: number;  // grossRevenue - allowedExpenses
}

// ── Full inputs ───────────────────────────────────────────────────────────────
export interface TaxInputs {
  filingStatus:      string;
  // Schedule C entries (one per self-employed taxpayer)
  scheduleC?:        ScheduleCEntry[];
  // Legacy single SE profit (still supported — used when scheduleC not provided)
  seNetProfit?:      number;
  // W-2
  w2Income:          number;
  w2Withholding:     number;
  n99Withholding:    number;
  estimatedPayments: number;
  numChildren:       number;
  // Capital gains from Schedule D / Form 8949
  capitalGains?:     number;   // 1040 line 7
  standardDedOverride?: number;
}

// ── Source map — every line knows its origin ──────────────────────────────────
export interface LineSource {
  from:    string;   // e.g. "Schedule C line 31"
  formula: string;   // e.g. "8,631 + 4,380"
  detail?: string;   // breakdown per taxpayer
}

export interface TaxResult {
  // Income (1040 Page 1)
  line1a:  number;   // W-2 wages
  line7:   number;   // Capital gains (Schedule D)
  line8:   number;   // SE income (Schedule 1 line 10)
  line9:   number;   // Total income = line1a + line7 + line8
  // Adjustments
  seTax:        number;
  seDeductible: number;
  line10:  number;   // Total adjustments = SE deduction (Schedule 1 line 26)
  line11:  number;   // AGI = line9 - line10
  // Deductions
  line12:  number;   // Standard deduction
  line13:  number;   // QBI deduction (Form 8995)
  line14:  number;   // Total deductions
  line15:  number;   // Taxable income
  // Tax & Credits (1040 Page 2)
  line16:  number;   // Income tax from brackets
  line19:  number;   // Child tax credit
  line22:  number;   // Tax after credits
  line23:  number;   // SE tax (Schedule 2 line 21)
  line24:  number;   // Total tax
  // Payments
  line25a: number;   // W-2 withholding
  line25b: number;   // 1099 withholding
  line25d: number;   // Total withholding
  line26:  number;   // Estimated payments
  line33:  number;   // Total payments
  // Result
  line34:  number;   // Refund
  line37:  number;   // Amount owed
  isRefund: boolean;
  effectiveRate: number;
  // Schedule breakdown (for source map display)
  scheduleC:     ScheduleCEntry[];   // per-taxpayer Schedule C
  schC_total:    number;             // sum of all Schedule C net profits → Sch1 line 3
  seTax_primary: number;             // SE tax for primary → Sch SE line 12
  seTax_spouse:  number;             // SE tax for spouse → Sch SE line 12
  seHalf_primary: number;            // 50% deduction primary → Sch SE line 13
  seHalf_spouse:  number;            // 50% deduction spouse → Sch SE line 13
  // Source map
  sourceMap: Record<string, LineSource>;
}

// ── Helper functions ──────────────────────────────────────────────────────────
export function calcSETax(netProfit: number): number {
  const seEarnings = netProfit * 0.9235;
  if (seEarnings < 400) return 0;
  const ssTax  = Math.min(seEarnings, SS_WAGE_BASE_2024) * 0.124;
  const medTax = seEarnings * 0.029;
  return Math.round(ssTax + medTax);
}

export function calcIncomeTax(taxableIncome: number, filingStatus: string): number {
  const brackets = BRACKETS[filingStatus] ?? BRACKETS["SINGLE"];
  let tax = 0, prev = 0;
  for (const [upper, rate] of brackets) {
    if (taxableIncome <= prev) break;
    tax += (Math.min(taxableIncome, upper) - prev) * rate;
    prev = upper;
  }
  return Math.round(tax);
}

export function calcChildTaxCredit(numChildren: number, agi: number, filingStatus: string): number {
  if (numChildren === 0) return 0;
  const phaseOutStart = filingStatus === "MARRIED_FILING_JOINTLY" ? CTC_PHASE_OUT_MFJ : CTC_PHASE_OUT_SINGLE;
  const reduction     = Math.ceil(Math.max(0, agi - phaseOutStart) / 1000) * 50;
  return Math.max(0, numChildren * CTC_PER_CHILD - reduction);
}

// ── Main calculation ──────────────────────────────────────────────────────────
export function calculate(inputs: TaxInputs): TaxResult {
  const {
    filingStatus, w2Income, w2Withholding, n99Withholding,
    estimatedPayments, numChildren, standardDedOverride,
    capitalGains = 0,
  } = inputs;

  // ── Schedule C — per taxpayer ─────────────────────────────────────────────
  const rawC: ScheduleCEntry[] = inputs.scheduleC?.length
    ? inputs.scheduleC
    : [{ name: "Primary", grossRevenue: inputs.seNetProfit ?? 0, allowedExpenses: 0 }];

  const scheduleC: ScheduleCEntry[] = rawC.map(c => ({
    ...c,
    netProfit: Math.max(0, c.grossRevenue - c.allowedExpenses),
  }));

  const schC_total = scheduleC.reduce((s, c) => s + (c.netProfit ?? 0), 0);

  // ── SE tax per taxpayer (Schedule SE) ────────────────────────────────────
  const seTax_primary = calcSETax(scheduleC[0]?.netProfit ?? 0);
  const seTax_spouse  = scheduleC[1] ? calcSETax(scheduleC[1].netProfit ?? 0) : 0;
  const seHalf_primary = Math.round(seTax_primary * 0.5);
  const seHalf_spouse  = Math.round(seTax_spouse  * 0.5);

  const seTax      = seTax_primary + seTax_spouse;
  const seDeductible = seHalf_primary + seHalf_spouse;  // Schedule 1 line 26

  // ── 1040 Income ─────────────────────────────────────────────────────────
  const line1a = Math.round(w2Income);
  const line7  = Math.round(capitalGains);         // Schedule D → 1040 line 7
  const line8  = Math.round(schC_total);           // Schedule 1 line 10 → 1040 line 8
  const line9  = line1a + line7 + line8;           // Total income

  // ── Adjustments ──────────────────────────────────────────────────────────
  const line10 = seDeductible;                     // Schedule 1 line 26
  const line11 = Math.max(0, line9 - line10);      // AGI

  // ── Deductions ───────────────────────────────────────────────────────────
  const line12     = standardDedOverride ?? (STANDARD_DEDUCTIONS[filingStatus] ?? 14600);
  const preTaxable = Math.max(0, line11 - line12);
  const line13     = Math.round(Math.min(line8 * 0.20, preTaxable * 0.20));  // QBI (Form 8995)
  const line14     = line12 + line13;
  const line15     = Math.max(0, line11 - line14);

  // ── Tax & Credits ────────────────────────────────────────────────────────
  const line16 = calcIncomeTax(line15, filingStatus);
  const line19 = calcChildTaxCredit(numChildren, line11, filingStatus);
  const line22 = Math.max(0, line16 - line19);
  const line23 = seTax;                            // Schedule 2 line 21
  const line24 = line22 + line23;                  // Total tax

  // ── Payments ─────────────────────────────────────────────────────────────
  const line25a = Math.round(w2Withholding);
  const line25b = Math.round(n99Withholding);
  const line25d = line25a + line25b;
  const line26  = Math.round(estimatedPayments);
  const line33  = line25d + line26;

  // ── Result ────────────────────────────────────────────────────────────────
  const isRefund = line33 > line24;
  const line34   = isRefund ? line33 - line24 : 0;
  const line37   = isRefund ? 0 : line24 - line33;
  const effectiveRate = line9 > 0 ? Math.round(line24 / line9 * 1000) / 10 : 0;

  // ── Source Map ───────────────────────────────────────────────────────────
  const fmt = (n: number) => n.toLocaleString("en-US");

  const schCDetail = scheduleC.map(c =>
    `${c.name}: $${fmt(c.netProfit ?? 0)}`
  ).join(" + ");

  const seDetail = scheduleC.map((c, i) => {
    const tax = i === 0 ? seTax_primary : seTax_spouse;
    return `${c.name}: $${fmt(tax)}`;
  }).join(" + ");

  const seHalfDetail = scheduleC.map((c, i) => {
    const half = i === 0 ? seHalf_primary : seHalf_spouse;
    return `${c.name}: $${fmt(half)}`;
  }).join(" + ");

  const sourceMap: Record<string, LineSource> = {
    // Schedule C
    schC: {
      from:    "Schedule C line 31 (per taxpayer)",
      formula: schCDetail,
      detail:  `Net profit = gross revenue − allowed expenses`,
    },
    // Schedule 1
    sch1_line3: {
      from:    "Schedule 1 line 3",
      formula: `${fmt(line8)} (business income)`,
      detail:  schCDetail,
    },
    sch1_line26: {
      from:    "Schedule 1 line 26",
      formula: `${seHalfDetail} = $${fmt(seDeductible)}`,
      detail:  "50% of SE tax per taxpayer (Schedule SE line 13)",
    },
    // Schedule SE
    schSE_line12: {
      from:    "Schedule SE line 12 (per taxpayer)",
      formula: seDetail,
      detail:  `SE tax = net profit × 92.35% × 15.3%`,
    },
    schSE_line13: {
      from:    "Schedule SE line 13 (per taxpayer)",
      formula: seHalfDetail,
      detail:  "50% deductible half of SE tax",
    },
    // Schedule D / Form 8949
    schD_line16: {
      from:    "Schedule D line 16 (Form 8949)",
      formula: `$${fmt(line7)} capital gain`,
      detail:  "Short-term gains from brokerage (Box A)",
    },
    // 1040 lines
    "1040_line1a": { from: "1040 line 1a",  formula: `$${fmt(line1a)}`, detail: "W-2 wages" },
    "1040_line7":  { from: "1040 line 7",   formula: `$${fmt(line7)}`,  detail: "Capital gains from Schedule D line 16" },
    "1040_line8":  { from: "1040 line 8",   formula: `$${fmt(line8)}`,  detail: `Business income from Schedule 1 line 10 (= Schedule C total: ${schCDetail})` },
    "1040_line9":  { from: "1040 line 9",   formula: `$${fmt(line1a)} + $${fmt(line7)} + $${fmt(line8)} = $${fmt(line9)}`, detail: "W-2 + capital gains + SE income" },
    "1040_line10": { from: "1040 line 10",  formula: `$${fmt(seDeductible)} (from Schedule 1 line 26)`, detail: seHalfDetail },
    "1040_line11": { from: "1040 line 11",  formula: `$${fmt(line9)} − $${fmt(seDeductible)} = $${fmt(line11)}`, detail: "AGI = total income − adjustments" },
    "1040_line12": { from: "1040 line 12",  formula: `$${fmt(line12)}`, detail: `Standard deduction (${filingStatus.replace(/_/g," ")})` },
    "1040_line13": { from: "1040 line 13",  formula: `$${fmt(line13)}`, detail: "QBI deduction (Form 8995) = 20% of net SE profit" },
    "1040_line15": { from: "1040 line 15",  formula: `$${fmt(line15)}`, detail: "Taxable income = AGI − standard deduction − QBI" },
    "1040_line16": { from: "1040 line 16",  formula: `$${fmt(line16)}`, detail: "Income tax from brackets" },
    "1040_line19": { from: "1040 line 19",  formula: `$${fmt(line19)}`, detail: `Child tax credit (${numChildren} child${numChildren !== 1 ? "ren" : ""})` },
    "1040_line22": { from: "1040 line 22",  formula: `$${fmt(line22)}`, detail: "Tax after credits" },
    "1040_line23": { from: "1040 line 23",  formula: `$${fmt(line23)} (from Schedule 2 line 21)`, detail: seDetail },
    "1040_line24": { from: "1040 line 24",  formula: `$${fmt(line22)} + $${fmt(line23)} = $${fmt(line24)}`, detail: "Total tax = income tax after credits + SE tax" },
    "1040_line25d":{ from: "1040 line 25d", formula: `$${fmt(line25a)} + $${fmt(line25b)} = $${fmt(line25d)}`, detail: "W-2 withholding + 1099 withholding" },
    "1040_line33": { from: "1040 line 33",  formula: `$${fmt(line33)}`, detail: "Total payments" },
    "1040_line37": { from: "1040 line 37",  formula: `$${fmt(line37)}`, detail: "Amount owed = total tax − total payments" },
    "1040_line34": { from: "1040 line 34",  formula: `$${fmt(line34)}`, detail: "Refund = total payments − total tax" },
    // 8879 lines
    "8879_line1": { from: "Form 8879 line 1 = 1040 line 11", formula: `$${fmt(line11)}`, detail: "AGI" },
    "8879_line2": { from: "Form 8879 line 2 = 1040 line 24", formula: `$${fmt(line24)}`, detail: "Total tax" },
    "8879_line3": { from: "Form 8879 line 3 = 1040 line 25d",formula: `$${fmt(line25d)}`,detail: "Federal income tax withheld" },
    "8879_line4": { from: "Form 8879 line 4 = 1040 line 34", formula: `$${fmt(line34)}`, detail: "Refund" },
    "8879_line5": { from: "Form 8879 line 5 = 1040 line 37", formula: `$${fmt(line37)}`, detail: "Amount you owe" },
  };

  return {
    line1a, line7, line8, line9,
    seTax, seDeductible, line10, line11,
    line12, line13, line14, line15,
    line16, line19, line22, line23, line24,
    line25a, line25b, line25d, line26, line33,
    line34, line37,
    isRefund, effectiveRate,
    scheduleC,
    schC_total,
    seTax_primary, seTax_spouse,
    seHalf_primary, seHalf_spouse,
    sourceMap,
  };
}
