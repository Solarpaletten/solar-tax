// lib/pdf/summary.ts
// Generates a clean PDF summary of a tax year scenario.
// Uses pdf-lib — no headless browser, no external service.
// Output: Uint8Array ready for download response.

import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "$0";
  const abs = Math.abs(n);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);
  return n < 0 ? `(${formatted})` : formatted;
}

function pct(value: string): string {
  return `${parseFloat(value).toFixed(1)}%`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PDFScenarioData {
  scenarioName: string;
  grossIncome:            string;
  allowedExpenses:        string;
  netProfit:              string;
  seTax:                  string;
  deductibleSEhalf:       string;
  agi:                    string;
  standardDeduction:      string;
  taxableIncome:          string;
  totalCredits:           string;
  incomeTax:              string;
  totalTax:               string;
  refundAmount:           string;
  amountDue:              string;
  effectiveRate:          string;
}

export interface PDFSummaryInput {
  householdName:  string;
  taxYear:        number;
  filingStatus:   string;
  generatedAt:    string; // ISO string
  scenarios:      PDFScenarioData[];
}

// ── PDF Generator ─────────────────────────────────────────────────────────────
export async function generateTaxSummaryPDF(
  input: PDFSummaryInput
): Promise<Uint8Array> {
  const doc  = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg  = await doc.embedFont(StandardFonts.Helvetica);

  // ── Colors ─────────────────────────────────────────────────────────────────
  const DARK    = rgb(0.08, 0.08, 0.12);
  const BLUE    = rgb(0.06, 0.20, 0.38);
  const INDIGO  = rgb(0.31, 0.27, 0.90);
  const GREEN   = rgb(0.12, 0.55, 0.29);
  const RED     = rgb(0.65, 0.10, 0.10);
  const MUTED   = rgb(0.45, 0.45, 0.50);
  const LIGHT   = rgb(0.96, 0.96, 0.98);
  const WHITE   = rgb(1, 1, 1);
  const BORDER  = rgb(0.82, 0.82, 0.86);

  // ── Page 1 — Cover + all scenarios ────────────────────────────────────────
  const page = doc.addPage([612, 792]); // US Letter
  const { width, height } = page.getSize();
  let y = height - 50;

  // Header bar
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: BLUE });
  page.drawText("☀  SOLAR TAX ENGINE", {
    x: 40, y: height - 42,
    size: 20, font: bold, color: WHITE,
  });
  page.drawText("Scenario Summary Report", {
    x: 40, y: height - 62,
    size: 10, font: reg, color: rgb(0.7, 0.8, 1),
  });
  page.drawText(`Generated ${new Date(input.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, {
    x: width - 200, y: height - 62,
    size: 9, font: reg, color: rgb(0.7, 0.8, 1),
  });

  y = height - 110;

  // Household info
  page.drawText(`${input.householdName}  ·  Tax Year ${input.taxYear}  ·  ${input.filingStatus.replace(/_/g, " ")}`, {
    x: 40, y,
    size: 13, font: bold, color: DARK,
  });
  y -= 28;

  // Disclaimer
  page.drawRectangle({ x: 40, y: y - 20, width: width - 80, height: 22, color: rgb(1, 0.97, 0.88) });
  page.drawText("⚠  ESTIMATE ONLY — Not for filing. Not tax advice. For planning purposes only.", {
    x: 48, y: y - 14, size: 8, font: reg, color: rgb(0.5, 0.35, 0),
  });
  y -= 42;

  // ── Scenario columns ───────────────────────────────────────────────────────
  const colW = (width - 80 - (input.scenarios.length - 1) * 10) / input.scenarios.length;
  const colX = input.scenarios.map((_, i) => 40 + i * (colW + 10));

  // Scenario header badges
  const BADGE_COLORS: Record<string, ReturnType<typeof rgb>> = {
    CONSERVATIVE: rgb(0.06, 0.28, 0.55),
    BALANCED:     INDIGO,
    AGGRESSIVE:   rgb(0.40, 0.10, 0.65),
  };

  for (let i = 0; i < input.scenarios.length; i++) {
    const s = input.scenarios[i];
    const key = s.scenarioName.toUpperCase();
    const badgeColor = BADGE_COLORS[key] ?? INDIGO;
    page.drawRectangle({ x: colX[i], y: y - 22, width: colW, height: 24, color: badgeColor });
    page.drawText(s.scenarioName, {
      x: colX[i] + 10, y: y - 14,
      size: 11, font: bold, color: WHITE,
    });
  }
  y -= 36;

  // ── Data rows ──────────────────────────────────────────────────────────────
  const rows: Array<{
    label: string;
    key: keyof PDFScenarioData;
    divider?: boolean;
    highlight?: boolean;
    sign?: "minus" | "credit";
  }> = [
    { label: "Gross Income",        key: "grossIncome" },
    { label: "Allowed Expenses",    key: "allowedExpenses",  sign: "minus" },
    { label: "Net Profit",          key: "netProfit",        divider: true },
    { label: "SE Tax",              key: "seTax",            sign: "minus" },
    { label: "SE Deductible Half",  key: "deductibleSEhalf" },
    { label: "AGI",                 key: "agi",              divider: true },
    { label: "Standard Deduction",  key: "standardDeduction", sign: "minus" },
    { label: "Taxable Income",      key: "taxableIncome",    divider: true },
    { label: "Income Tax",          key: "incomeTax",        sign: "minus" },
    { label: "Total Credits",       key: "totalCredits",     sign: "credit" },
    { label: "Total Tax",           key: "totalTax",         sign: "minus", divider: true },
    { label: "Effective Rate",      key: "effectiveRate" },
  ];

  const ROW_H = 20;

  for (const row of rows) {
    if (row.divider) {
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: BORDER });
      y -= 4;
    }

    // Row background (alternating)
    const rowIdx = rows.indexOf(row);
    if (rowIdx % 2 === 0) {
      page.drawRectangle({ x: 40, y: y - ROW_H + 4, width: width - 80, height: ROW_H, color: LIGHT });
    }

    // Label
    page.drawText(row.label, { x: 48, y: y - 12, size: 9, font: reg, color: MUTED });

    // Values per scenario
    for (let i = 0; i < input.scenarios.length; i++) {
      const s = input.scenarios[i];
      let rawValue = s[row.key] as string;
      let displayValue: string;

      if (row.key === "effectiveRate") {
        displayValue = pct(rawValue);
      } else {
        displayValue = fmt(rawValue);
        if (row.sign === "minus") displayValue = `− ${displayValue}`;
        if (row.sign === "credit") displayValue = `+ ${displayValue}`;
      }

      const textColor =
        row.sign === "minus"  ? RED   :
        row.sign === "credit" ? GREEN :
        DARK;

      page.drawText(displayValue, {
        x: colX[i] + colW - 10 - bold.widthOfTextAtSize(displayValue, 9),
        y: y - 12,
        size: 9, font: row.key === "netProfit" || row.key === "taxableIncome" ? bold : reg,
        color: textColor,
      });
    }

    y -= ROW_H;
  }

  // ── Refund / Due highlight boxes ────────────────────────────────────────────
  y -= 12;
  for (let i = 0; i < input.scenarios.length; i++) {
    const s = input.scenarios[i];
    const isRefund = parseFloat(s.refundAmount) > 0;
    const amount   = isRefund ? s.refundAmount : s.amountDue;
    const boxColor = isRefund ? rgb(0.88, 0.97, 0.90) : rgb(0.98, 0.90, 0.90);
    const txtColor = isRefund ? GREEN : RED;
    const label    = isRefund ? "ESTIMATED REFUND" : "AMOUNT DUE";

    page.drawRectangle({
      x: colX[i], y: y - 46,
      width: colW, height: 50,
      color: boxColor,
      borderColor: isRefund ? GREEN : RED,
      borderWidth: 1,
    });
    page.drawText(label, { x: colX[i] + 8, y: y - 20, size: 8, font: bold, color: txtColor });
    page.drawText(fmt(amount), { x: colX[i] + 8, y: y - 36, size: 16, font: bold, color: txtColor });
  }
  y -= 66;

  // ── Footer ─────────────────────────────────────────────────────────────────
  y = 40;
  page.drawLine({ start: { x: 40, y: y + 14 }, end: { x: width - 40, y: y + 14 }, thickness: 0.5, color: BORDER });
  page.drawText("Solar Tax Engine  ·  Project 43  ·  For planning purposes only. Not tax advice. Not for IRS filing.", {
    x: 40, y: y, size: 7.5, font: reg, color: MUTED,
  });

  return doc.save();
}
