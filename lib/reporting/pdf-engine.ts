// lib/reporting/pdf-engine.ts
// Full IRS PDF Engine — Form 1040 + all schedules, exact line mapping
// Uses pdf-lib. Generates multi-page packet in official form order:
// 8879 → 1040 (p1+p2) → Sch1 → Sch2 → SchC×2 → SchD → SchSE×2 → 8995

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import type { IRS1040Report } from "./types";

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  black:  rgb(0.05, 0.05, 0.08),
  blue:   rgb(0.07, 0.24, 0.56),
  green:  rgb(0.04, 0.50, 0.31),
  red:    rgb(0.72, 0.12, 0.12),
  gray:   rgb(0.50, 0.50, 0.54),
  light:  rgb(0.96, 0.97, 0.99),
  amber:  rgb(0.91, 0.62, 0.04),
  white:  rgb(1, 1, 1),
  sun:    rgb(0.91, 0.46, 0.04),  // Solar orange
  border: rgb(0.82, 0.84, 0.88),
};

// ── Context passed to every page builder ─────────────────────────────────────
interface Ctx {
  doc:  PDFDocument;
  bold: PDFFont;
  reg:  PDFFont;
  mono: PDFFont;
  r:    IRS1040Report;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function p(v?: string | null): number {
  return parseFloat(v ?? "0") || 0;
}
function dollar(v?: string | null, forceSign = false): string {
  const n = p(v);
  if (!n && n !== 0) return "—";
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0 });
  if (n < 0) return `(${abs})`;
  if (forceSign && n > 0) return `+${abs}`;
  return abs;
}
function addPage(ctx: Ctx): PDFPage {
  return ctx.doc.addPage([612, 792]); // US Letter
}

// ── Row drawing helpers ───────────────────────────────────────────────────────
function drawHeader(
  page: PDFPage,
  ctx: Ctx,
  formName: string,
  formTitle: string,
  year: number | string
): void {
  // IRS-blue header bar
  page.drawRectangle({ x: 0, y: 762, width: 612, height: 30, color: C.blue });
  page.drawText(formName, { x: 24, y: 773, size: 11, font: ctx.bold, color: C.white });
  page.drawText(formTitle, { x: 24, y: 763, size: 7.5, font: ctx.reg, color: rgb(0.8, 0.88, 1) });
  page.drawText(`Tax Year ${year}`, { x: 530, y: 773, size: 9, font: ctx.bold, color: C.white });

  // Solar badge (bottom-right)
  page.drawText("☀ SolarTax", { x: 488, y: 763, size: 7, font: ctx.reg, color: C.amber });
}

function drawSectionBar(page: PDFPage, ctx: Ctx, y: number, label: string): void {
  page.drawRectangle({ x: 24, y: y - 2, width: 564, height: 16, color: C.light });
  page.drawRectangle({ x: 24, y: y - 2, width: 3,   height: 16, color: C.blue });
  page.drawText(label.toUpperCase(), { x: 32, y: y + 2, size: 7.5, font: ctx.bold, color: C.blue });
}

function drawLine(
  page: PDFPage,
  ctx: Ctx,
  y: number,
  lineNum: string,
  label: string,
  value?: string | null,
  opts?: { color?: ReturnType<typeof rgb>; bold?: boolean; indent?: number; note?: string }
): void {
  const x       = 24 + (opts?.indent ?? 0);
  const font    = opts?.bold ? ctx.bold : ctx.reg;
  const color   = opts?.color ?? C.black;
  const valColor= opts?.color ?? C.black;

  // Line number in gray box
  page.drawRectangle({ x: 24, y: y - 1, width: 20, height: 11, color: C.light });
  page.drawText(lineNum, { x: 25, y: y + 1, size: 7, font: ctx.bold, color: C.gray });

  // Label
  page.drawText(label, { x: x + 26, y: y + 1, size: 8, font, color });

  // Value right-aligned
  if (value !== undefined && value !== null) {
    const val = dollar(value);
    const vw  = ctx.bold.widthOfTextAtSize(val, 9);
    page.drawText(val, { x: 588 - vw, y: y + 1, size: 9, font: ctx.bold, color: valColor });
    // Underline
    page.drawLine({ start: { x: 450, y }, end: { x: 588, y }, thickness: 0.3, color: C.border });
  }

  // Note
  if (opts?.note) {
    page.drawText(opts.note, { x: x + 26, y: y - 8, size: 6.5, font: ctx.reg, color: C.gray });
  }
}

function drawDivider(page: PDFPage, y: number): void {
  page.drawLine({ start: { x: 24, y }, end: { x: 588, y }, thickness: 0.5, color: C.border });
}

function drawTaxpayerBox(page: PDFPage, ctx: Ctx, y: number): number {
  const r = ctx.r;
  page.drawRectangle({ x: 24, y: y - 56, width: 564, height: 60, color: C.light, borderColor: C.border, borderWidth: 0.5 });
  page.drawText("TAXPAYER", { x: 30, y: y - 6, size: 7, font: ctx.bold, color: C.gray });
  page.drawText(r.taxpayerName, { x: 30, y: y - 18, size: 11, font: ctx.bold, color: C.black });
  if (r.spouseName) {
    page.drawText(`Spouse: ${r.spouseName}`, { x: 30, y: y - 30, size: 9, font: ctx.reg, color: C.gray });
  }
  page.drawText(r.filingStatus.replace(/_/g, " "), { x: 30, y: y - 42, size: 8, font: ctx.reg, color: C.blue });
  if (r.address) {
    page.drawText(r.address, { x: 300, y: y - 18, size: 8, font: ctx.reg, color: C.gray });
  }
  return y - 70;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM 8879 — e-file Signature Authorization
// ═══════════════════════════════════════════════════════════════════════════════
function buildForm8879(ctx: Ctx): void {
  const page = addPage(ctx);
  const r    = ctx.r;
  drawHeader(page, ctx, "Form 8879", "IRS e-file Signature Authorization", r.taxYear);

  let y = 740;
  page.drawText("OMB No. 1545-1867", { x: 480, y: y, size: 7, font: ctx.reg, color: C.gray });

  y -= 20;
  drawSectionBar(page, ctx, y, "Taxpayer Information");
  y -= 22;
  page.drawText("Taxpayer's name", { x: 30, y, size: 7, font: ctx.reg, color: C.gray });
  page.drawText(r.taxpayerName, { x: 30, y: y - 10, size: 10, font: ctx.bold, color: C.black });
  if (r.spouseName) {
    page.drawText("Spouse's name", { x: 310, y, size: 7, font: ctx.reg, color: C.gray });
    page.drawText(r.spouseName, { x: 310, y: y - 10, size: 10, font: ctx.bold, color: C.black });
  }
  y -= 36;

  drawSectionBar(page, ctx, y, "Part I — Tax Return Information (Whole dollars only)");
  y -= 22;

  const lines8879 = [
    { n: "1",  label: "Adjusted gross income (Form 1040, line 11)",         val: r.line11  },
    { n: "2",  label: "Total tax (Form 1040, line 24)",                      val: r.line24  },
    { n: "3",  label: "Federal income tax withheld (Form 1040, line 25d)",   val: r.line25d },
    { n: "4",  label: "Refund (Form 1040, line 35a / 36)",                   val: r.line34 ?? r.line35a },
    { n: "5",  label: "Amount you owe (Form 1040, line 37)",                 val: r.line37  },
  ];
  for (const ln of lines8879) {
    drawLine(page, ctx, y, ln.n, ln.label, ln.val,
      ln.n === "4" ? { color: C.green } : ln.n === "5" ? { color: C.red } : {});
    y -= 18;
  }
  y -= 10;

  drawSectionBar(page, ctx, y, "Part II — Taxpayer Declaration and Signature Authorization");
  y -= 16;
  const consent = [
    "Under penalties of perjury, I declare that the information I have provided to my Electronic Return Originator (ERO)",
    "and/or transmitter, and the amounts shown in Part I above, agree with the amounts shown on the corresponding lines",
    "of my electronic income tax return. To the best of my knowledge and belief, my return is true, accurate, and complete.",
    "I consent to allow my ERO to send my return to the IRS.",
  ];
  for (const line of consent) {
    page.drawText(line, { x: 30, y, size: 7.5, font: ctx.reg, color: C.black });
    y -= 11;
  }
  y -= 16;

  // Signature boxes
  const sigBoxes = [
    { label: "Taxpayer's signature", name: r.taxpayerName, date: new Date().toLocaleDateString("en-US") },
    ...(r.spouseName ? [{ label: "Spouse's signature", name: r.spouseName, date: new Date().toLocaleDateString("en-US") }] : []),
  ];
  for (const box of sigBoxes) {
    page.drawRectangle({ x: 24, y: y - 28, width: 270, height: 32, color: C.light, borderColor: C.border, borderWidth: 0.5 });
    page.drawText(box.label, { x: 30, y: y - 4, size: 7, font: ctx.reg, color: C.gray });
    page.drawText(`PIN: ●●●●●  (5-digit self-select PIN)`, { x: 30, y: y - 14, size: 8, font: ctx.reg, color: C.black });
    page.drawText(`Date: ${box.date}`, { x: 30, y: y - 22, size: 7.5, font: ctx.reg, color: C.black });
    y -= 44;
  }

  // Footer
  drawDivider(page, 36);
  page.drawText("Form 8879 (Rev. January 2021)  Cat. No. 32778B", { x: 24, y: 24, size: 7, font: ctx.reg, color: C.gray });
  page.drawText("For Paperwork Reduction Act Notice, see instructions.", { x: 300, y: 24, size: 7, font: ctx.reg, color: C.gray });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM 1040 — Page 1 (Lines 1–15)
// ═══════════════════════════════════════════════════════════════════════════════
function buildForm1040Page1(ctx: Ctx): void {
  const page = addPage(ctx);
  const r    = ctx.r;
  drawHeader(page, ctx, "Form 1040", "U.S. Individual Income Tax Return", r.taxYear);

  let y = 740;
  page.drawText("Department of the Treasury — Internal Revenue Service", { x: 24, y: y, size: 7, font: ctx.reg, color: C.gray });
  page.drawText("OMB No. 1545-0074", { x: 480, y: y, size: 7, font: ctx.reg, color: C.gray });

  y -= 16;
  y = drawTaxpayerBox(page, ctx, y);
  y -= 6;

  // Filing Status
  page.drawText(`Filing Status: ${r.filingStatus.replace(/_/g, " ")}`, { x: 30, y, size: 8.5, font: ctx.bold, color: C.blue });
  y -= 20;

  drawSectionBar(page, ctx, y, "Income");
  y -= 22;

  const incomeLines = [
    { n: "1a",  label: "Total wages, salaries, tips (Form W-2, box 1)",            val: r.line1a },
    { n: "1z",  label: "Add lines 1a through 1h — total earned income",            val: r.line1a },
    { n: "2b",  label: "Taxable interest",                                          val: null      },
    { n: "3b",  label: "Ordinary dividends",                                        val: null      },
    { n: "4b",  label: "IRA distributions — taxable amount",                        val: null      },
    { n: "5b",  label: "Pensions and annuities — taxable amount",                   val: null      },
    { n: "6b",  label: "Social security benefits — taxable amount",                 val: null      },
    { n: "7",   label: "Capital gain or (loss) — attach Schedule D",               val: r.line7   },
    { n: "8",   label: "Additional income from Schedule 1, line 10",               val: r.line8   },
    { n: "9",   label: "TOTAL INCOME — Add lines 1z, 2b–6b, 7, and 8",            val: r.line9,  bold: true },
  ];
  for (const ln of incomeLines) {
    drawLine(page, ctx, y, ln.n, ln.label, ln.val ?? undefined,
      { bold: (ln as any).bold, color: (ln as any).bold ? C.blue : undefined });
    y -= 16;
  }
  y -= 6;

  drawSectionBar(page, ctx, y, "Adjustments to Income → AGI");
  y -= 22;
  drawLine(page, ctx, y, "10", "Adjustments to income from Schedule 1, line 26", r.line10);
  y -= 16;
  drawLine(page, ctx, y, "11", "ADJUSTED GROSS INCOME (line 9 − line 10)", r.line11,
    { bold: true, color: C.blue, note: "Key figure for IRS Free File eligibility" });
  y -= 28;

  drawSectionBar(page, ctx, y, "Deductions");
  y -= 22;
  drawLine(page, ctx, y, "12", `Standard deduction — ${r.filingStatus === "MARRIED_FILING_JOINTLY" ? "MFJ $29,200" : "Single $14,600"}`, r.line12);
  y -= 16;
  drawLine(page, ctx, y, "13", "Qualified business income deduction — Form 8995", r.line13);
  y -= 16;
  drawLine(page, ctx, y, "14", "Total deductions (add lines 12 and 13)", r.line14);
  y -= 16;
  drawLine(page, ctx, y, "15", "TAXABLE INCOME (line 11 − line 14)", r.line15,
    { bold: true, color: C.blue });
  y -= 28;

  drawDivider(page, y);
  page.drawText("Form 1040 (2024)  Page 1 of 2", { x: 24, y: y - 14, size: 7, font: ctx.reg, color: C.gray });
  page.drawText("Cat. No. 11320B", { x: 400, y: y - 14, size: 7, font: ctx.reg, color: C.gray });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM 1040 — Page 2 (Lines 16–38)
// ═══════════════════════════════════════════════════════════════════════════════
function buildForm1040Page2(ctx: Ctx): void {
  const page = addPage(ctx);
  const r    = ctx.r;
  drawHeader(page, ctx, "Form 1040 (continued)", "U.S. Individual Income Tax Return — Page 2", r.taxYear);

  let y = 740;

  drawSectionBar(page, ctx, y, "Tax and Credits");
  y -= 22;

  const taxLines = [
    { n: "16", label: "Tax (from IRS tax tables, Tax Computation Worksheet)",      val: r.line16 },
    { n: "17", label: "Alternative minimum tax — Schedule 2, line 3",              val: r.line17 },
    { n: "18", label: "Add lines 16 and 17",                                       val: r.line18 },
    { n: "19", label: "Child tax credit / Credit for other dependents (Sch 8812)", val: r.line19 },
    { n: "20", label: "Other credits — Schedule 3, line 8",                        val: r.line20 },
    { n: "21", label: "Add lines 19 and 20 — total credits",                       val: r.line21 },
    { n: "22", label: "Subtract line 21 from line 18 (tax after credits)",         val: r.line22 },
    { n: "23", label: "Other taxes — SE tax from Schedule 2, line 21",             val: r.line23 },
    { n: "24", label: "TOTAL TAX — Add lines 22 and 23",                          val: r.line24, bold: true },
  ];
  for (const ln of taxLines) {
    drawLine(page, ctx, y, ln.n, ln.label, ln.val ?? undefined,
      { bold: (ln as any).bold, color: (ln as any).bold ? C.red : undefined });
    y -= 16;
  }
  y -= 10;

  drawSectionBar(page, ctx, y, "Payments");
  y -= 22;
  drawLine(page, ctx, y, "25a", "Federal income tax withheld — Form(s) W-2", r.line25d);
  y -= 16;
  drawLine(page, ctx, y, "25b", "Federal income tax withheld — Form(s) 1099", null);
  y -= 16;
  drawLine(page, ctx, y, "25d", "Add lines 25a through 25c — total withholding", r.line25d);
  y -= 16;
  drawLine(page, ctx, y, "26",  "2024 estimated tax payments", r.line26);
  y -= 16;
  drawLine(page, ctx, y, "27",  "Earned income credit (EIC)", null);
  y -= 16;
  drawLine(page, ctx, y, "28",  "Additional child tax credit — Schedule 8812", null);
  y -= 16;
  drawLine(page, ctx, y, "32",  "Total other payments and refundable credits", null);
  y -= 16;
  drawLine(page, ctx, y, "33",  "TOTAL PAYMENTS — Add lines 25d, 26, and 32", r.line33,
    { bold: true });
  y -= 24;

  // Refund / Owe — highlighted box
  const isRefund = p(r.line34) > 0;
  page.drawRectangle({
    x: 24, y: y - 44, width: 564, height: 48,
    color: isRefund ? rgb(0.92, 0.98, 0.94) : rgb(0.99, 0.93, 0.93),
    borderColor: isRefund ? rgb(0.2, 0.7, 0.4) : rgb(0.8, 0.2, 0.2),
    borderWidth: 1,
  });
  drawSectionBar(page, ctx, y, isRefund ? "Refund" : "Amount You Owe");
  y -= 22;
  if (isRefund) {
    drawLine(page, ctx, y, "34",  "Amount overpaid (line 33 − line 24)", r.line34, { color: C.green, bold: true });
    y -= 16;
    drawLine(page, ctx, y, "35a", "Amount of line 34 you want REFUNDED to you", r.line35a ?? r.line34, { color: C.green });
  } else {
    drawLine(page, ctx, y, "37",  "Amount you OWE (line 24 − line 33)", r.line37, { color: C.red, bold: true });
    y -= 16;
    drawLine(page, ctx, y, "38",  "Estimated tax penalty", null, { color: C.red });
  }
  y -= 56;

  // Sign section
  drawSectionBar(page, ctx, y, "Sign Here");
  y -= 16;
  page.drawText(
    "Under penalties of perjury, I declare that I have examined this return and, to the best of my knowledge and belief,",
    { x: 30, y, size: 7.5, font: ctx.reg, color: C.black }
  );
  y -= 11;
  page.drawText(
    "it is true, correct, and complete. Declaration of preparer (other than taxpayer) is based on all information of which preparer has any knowledge.",
    { x: 30, y, size: 7.5, font: ctx.reg, color: C.black }
  );
  y -= 20;

  const today = new Date().toLocaleDateString("en-US");
  page.drawLine({ start: { x: 30, y }, end: { x: 260, y }, thickness: 0.5, color: C.border });
  page.drawText("Your signature (PIN authorized via Form 8879)", { x: 30, y: y - 10, size: 7, font: ctx.reg, color: C.gray });
  page.drawText(today, { x: 270, y, size: 8, font: ctx.reg, color: C.black });
  if (r.spouseName) {
    y -= 22;
    page.drawLine({ start: { x: 30, y }, end: { x: 260, y }, thickness: 0.5, color: C.border });
    page.drawText("Spouse's signature (PIN authorized via Form 8879)", { x: 30, y: y - 10, size: 7, font: ctx.reg, color: C.gray });
    page.drawText(today, { x: 270, y, size: 8, font: ctx.reg, color: C.black });
  }

  drawDivider(page, 36);
  page.drawText("Form 1040 (2024)  Page 2 of 2", { x: 24, y: 24, size: 7, font: ctx.reg, color: C.gray });
  page.drawText("Go to www.irs.gov/Form1040 for instructions.", { x: 350, y: 24, size: 7, font: ctx.reg, color: C.gray });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE 1 — Additional Income and Adjustments
// ═══════════════════════════════════════════════════════════════════════════════
function buildSchedule1(ctx: Ctx): void {
  const page = addPage(ctx);
  const r    = ctx.r;
  drawHeader(page, ctx, "Schedule 1", "Additional Income and Adjustments", r.taxYear);

  let y = 740;
  page.drawText("(Form 1040)  Attach to Form 1040.", { x: 24, y, size: 7.5, font: ctx.reg, color: C.gray });
  page.drawText("OMB No. 1545-0074", { x: 480, y, size: 7, font: ctx.reg, color: C.gray });

  y -= 16;
  page.drawText(r.taxpayerName, { x: 30, y, size: 10, font: ctx.bold, color: C.black });

  y -= 22;
  drawSectionBar(page, ctx, y, "Part I — Additional Income");
  y -= 22;

  const incomeLines = [
    { n: "1",  label: "Taxable refunds of state and local income taxes",         val: null },
    { n: "2a", label: "Alimony received — instruments executed before 12/31/2018", val: null },
    { n: "3",  label: "Business income or (loss) — attach Schedule C",            val: r.line8  },
    { n: "4",  label: "Other gains or (losses) — Form 4797",                      val: null },
    { n: "5",  label: "Rental real estate / royalties / partnerships — Schedule E", val: null },
    { n: "8a", label: "Net operating loss",                                         val: null },
    { n: "8b", label: "Gambling winnings",                                          val: null },
    { n: "10", label: "Combine lines 1 through 9 — add to Form 1040 line 8",       val: r.line8, bold: true },
  ];
  for (const ln of incomeLines) {
    drawLine(page, ctx, y, ln.n, ln.label, ln.val ?? undefined,
      { bold: (ln as any).bold, color: (ln as any).bold ? C.blue : undefined });
    y -= 16;
  }
  y -= 10;

  drawSectionBar(page, ctx, y, "Part II — Adjustments to Income");
  y -= 22;

  const adjLines = [
    { n: "11", label: "Educator expenses (max $300)",                             val: null },
    { n: "12", label: "Certain business expenses (Form 2106)",                    val: null },
    { n: "15", label: "Deductible part of self-employment tax",                   val: r.line10 },
    { n: "16", label: "Self-employed SEP, SIMPLE, and qualified plans",           val: null },
    { n: "17", label: "Self-employed health insurance deduction",                 val: null },
    { n: "19", label: "Student loan interest deduction (max $2,500)",             val: null },
    { n: "20", label: "Tuition and fees — Form 8917",                             val: null },
    { n: "26", label: "TOTAL ADJUSTMENTS — Add lines 11 through 25 → 1040 line 10", val: r.line10, bold: true },
  ];
  for (const ln of adjLines) {
    drawLine(page, ctx, y, ln.n, ln.label, ln.val ?? undefined,
      { bold: (ln as any).bold, color: (ln as any).bold ? C.blue : undefined });
    y -= 16;
  }

  drawDivider(page, 36);
  page.drawText("Schedule 1 (Form 1040) 2024", { x: 24, y: 24, size: 7, font: ctx.reg, color: C.gray });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE 2 — Additional Taxes
// ═══════════════════════════════════════════════════════════════════════════════
function buildSchedule2(ctx: Ctx): void {
  const page = addPage(ctx);
  const r    = ctx.r;
  drawHeader(page, ctx, "Schedule 2", "Additional Taxes", r.taxYear);

  let y = 740;
  page.drawText("(Form 1040)  Attach to Form 1040.", { x: 24, y, size: 7.5, font: ctx.reg, color: C.gray });
  page.drawText(r.taxpayerName, { x: 30, y: y - 16, size: 10, font: ctx.bold, color: C.black });

  y -= 38;
  drawSectionBar(page, ctx, y, "Part I — Alternative Minimum Tax (AMT)");
  y -= 22;
  drawLine(page, ctx, y, "1",  "Alternative minimum tax — Form 6251",   null);
  y -= 16;
  drawLine(page, ctx, y, "2",  "Excess advance premium tax credit repayment — Form 8962", null);
  y -= 16;
  drawLine(page, ctx, y, "3",  "Add lines 1 and 2 → Form 1040, line 17", r.line17);
  y -= 24;

  drawSectionBar(page, ctx, y, "Part II — Other Taxes");
  y -= 22;
  drawLine(page, ctx, y, "4",  "Self-employment tax — attach Schedule SE", r.line23);
  y -= 16;
  drawLine(page, ctx, y, "5a", "Unreported SS/Medicare tax — Form 4137",   null);
  y -= 16;
  drawLine(page, ctx, y, "8",  "Additional Medicare Tax — Form 8959",       null);
  y -= 16;
  drawLine(page, ctx, y, "9",  "Net Investment Income Tax — Form 8960",      null);
  y -= 16;
  drawLine(page, ctx, y, "17", "Other additional taxes",                     null);
  y -= 16;
  drawLine(page, ctx, y, "21", "TOTAL ADDITIONAL TAXES → 1040, line 23", r.line23, { bold: true, color: C.red });

  drawDivider(page, 36);
  page.drawText("Schedule 2 (Form 1040) 2024", { x: 24, y: 24, size: 7, font: ctx.reg, color: C.gray });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE C — Profit or Loss from Business (one per taxpayer)
// ═══════════════════════════════════════════════════════════════════════════════
function buildScheduleC(
  ctx: Ctx,
  taxpayerName: string,
  businessName: string,
  grossIncome: number,
  totalExpenses: number,
  netProfit: number,
  seTax: number
): void {
  const page = addPage(ctx);
  const r    = ctx.r;
  drawHeader(page, ctx, "Schedule C", "Profit or Loss From Business (Sole Proprietorship)", r.taxYear);

  let y = 740;
  page.drawText("(Form 1040)  Attach to Form 1040.", { x: 24, y, size: 7.5, font: ctx.reg, color: C.gray });
  page.drawText(r.taxpayerName ? "OMB No. 1545-0074" : "", { x: 480, y, size: 7, font: ctx.reg, color: C.gray });

  y -= 16;
  page.drawText(`Name of proprietor: ${taxpayerName}`, { x: 30, y, size: 9, font: ctx.bold, color: C.black });
  y -= 14;
  page.drawText(`Principal business or profession: ${businessName}`, { x: 30, y, size: 8.5, font: ctx.reg, color: C.black });
  y -= 22;

  drawSectionBar(page, ctx, y, "Part I — Income");
  y -= 22;
  drawLine(page, ctx, y, "1",  "Gross receipts or sales (1099-NEC / cash receipts)", String(grossIncome));
  y -= 16;
  drawLine(page, ctx, y, "2",  "Returns and allowances",             null);
  y -= 16;
  drawLine(page, ctx, y, "3",  "Subtract line 2 from line 1",        String(grossIncome));
  y -= 16;
  drawLine(page, ctx, y, "4",  "Cost of goods sold (Part III)",       null);
  y -= 16;
  drawLine(page, ctx, y, "7",  "GROSS INCOME — Add lines 3 and 6", String(grossIncome), { bold: true });
  y -= 24;

  drawSectionBar(page, ctx, y, "Part II — Expenses");
  y -= 22;

  // Itemized expenses from report
  const expItems = ctx.r.expenseItems.filter(e => parseFloat(e.amount) > 0);
  const byCategory: Record<string, number> = {};
  for (const e of expItems) {
    const allowed = parseFloat(e.amount) * e.businessPct / 100;
    byCategory[e.category] = (byCategory[e.category] ?? 0) + allowed;
  }

  const schCLines: [string, string, string | null][] = [
    ["8",  "Advertising",                 byCategory["ADVERTISING"] ? String(Math.round(byCategory["ADVERTISING"])) : null],
    ["9",  "Car and truck expenses",       byCategory["VEHICLE"] ? String(Math.round(byCategory["VEHICLE"])) : null],
    ["10", "Commissions and fees",         null],
    ["11", "Contract labor",               null],
    ["13", "Depreciation (Form 4562)",     byCategory["DEPRECIATION"] ? String(Math.round(byCategory["DEPRECIATION"])) : null],
    ["14", "Employee benefit programs",    null],
    ["15", "Insurance (other than health)",byCategory["INSURANCE"] ? String(Math.round(byCategory["INSURANCE"])) : null],
    ["16", "Interest — mortgage/other",    null],
    ["17", "Legal and professional services", byCategory["PROFESSIONAL"] ? String(Math.round(byCategory["PROFESSIONAL"])) : null],
    ["18", "Office expense",               byCategory["OFFICE"] ? String(Math.round(byCategory["OFFICE"])) : null],
    ["20", "Rent or lease",                byCategory["RENT"] ? String(Math.round(byCategory["RENT"])) : null],
    ["21", "Repairs and maintenance",      byCategory["REPAIRS"] ? String(Math.round(byCategory["REPAIRS"])) : null],
    ["22", "Supplies",                     byCategory["SUPPLIES"] ? String(Math.round(byCategory["SUPPLIES"])) : null],
    ["23", "Taxes and licenses",           byCategory["TAXES"] ? String(Math.round(byCategory["TAXES"])) : null],
    ["24", "Travel and meals",             byCategory["TRAVEL"] ? String(Math.round(byCategory["TRAVEL"])) : null],
    ["25", "Utilities",                    byCategory["UTILITIES"] ? String(Math.round(byCategory["UTILITIES"])) : null],
    ["27", "Other expenses",               byCategory["OTHER"] ? String(Math.round(byCategory["OTHER"])) : null],
    ["28", "TOTAL EXPENSES",              String(Math.round(totalExpenses))],
  ];
  for (const [n, label, val] of schCLines) {
    drawLine(page, ctx, y, n, label, val ?? undefined,
      n === "28" ? { bold: true } : {});
    y -= 14;
  }
  y -= 4;

  drawLine(page, ctx, y, "30", "Expenses for business use of your home — Form 8829", null);
  y -= 16;
  drawLine(page, ctx, y, "31", "NET PROFIT or (LOSS) → Schedule 1, line 3", String(Math.round(netProfit)),
    { bold: true, color: netProfit >= 0 ? C.green : C.red });

  drawDivider(page, 36);
  page.drawText("Schedule C (Form 1040) 2024", { x: 24, y: 24, size: 7, font: ctx.reg, color: C.gray });
  page.drawText("Go to www.irs.gov/ScheduleC for instructions.", { x: 300, y: 24, size: 7, font: ctx.reg, color: C.gray });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE SE — Self-Employment Tax (one per taxpayer)
// ═══════════════════════════════════════════════════════════════════════════════
function buildScheduleSE(ctx: Ctx, taxpayerName: string, netProfit: number, seTax: number, deductible: number): void {
  const page = addPage(ctx);
  const r    = ctx.r;
  drawHeader(page, ctx, "Schedule SE", "Self-Employment Tax", r.taxYear);

  let y = 740;
  page.drawText("(Form 1040)  Attach to Form 1040.", { x: 24, y, size: 7.5, font: ctx.reg, color: C.gray });
  page.drawText(r.taxpayerName ? "OMB No. 1545-0074" : "", { x: 480, y, size: 7, font: ctx.reg, color: C.gray });

  y -= 16;
  page.drawText(`Name: ${taxpayerName}`, { x: 30, y, size: 9, font: ctx.bold, color: C.black });
  y -= 22;

  drawSectionBar(page, ctx, y, "Section A — Short Schedule SE");
  y -= 22;

  const seEarnings = netProfit * 0.9235;
  const ssWageBase = 168600; // 2024
  const seTaxRate  = seEarnings <= ssWageBase ? 0.153 : 0.029;
  const computedSE = Math.round(seEarnings * seTaxRate * 100) / 100;

  const seLines: [string, string, string | null, any?][] = [
    ["1a", "Net farm profit / (loss)",                                      null],
    ["2",  "Net profit from Schedule C (or F), line 31",                   String(Math.round(netProfit))],
    ["3",  "Combine lines 1a, 1b, and 2",                                  String(Math.round(netProfit))],
    ["4a", "Net earnings from SE × 92.35% (× 0.9235)",                    String(Math.round(seEarnings))],
    ["4b", "If line 4a is less than $400, do not file Schedule SE",       null, { color: C.gray }],
    ["4c", "Multiply line 4a by 15.3% (or 2.9% above SS wage base)",     String(Math.round(computedSE))],
    ["5",  "SE Tax: If line 4a ≤ $168,600: line 4a × 0.153",             String(Math.round(seTax))],
    ["6",  "DEDUCTION: 50% of SE tax → Schedule 1, line 15",             String(Math.round(deductible)), { color: C.green, bold: true }],
  ];
  for (const [n, label, val, opts] of seLines) {
    drawLine(page, ctx, y, n, label, val ?? undefined, opts ?? {});
    y -= 18;
  }

  y -= 10;
  page.drawRectangle({ x: 24, y: y - 28, width: 564, height: 32, color: rgb(0.99, 0.95, 0.88) });
  drawLine(page, ctx, y - 8, "SE", "SELF-EMPLOYMENT TAX → Schedule 2, line 4 / 1040, line 23",
    String(Math.round(seTax)), { bold: true, color: C.red });

  drawDivider(page, 36);
  page.drawText("Schedule SE (Form 1040) 2024", { x: 24, y: 24, size: 7, font: ctx.reg, color: C.gray });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM 8995 — QBI Deduction
// ═══════════════════════════════════════════════════════════════════════════════
function buildForm8995(ctx: Ctx): void {
  const page = addPage(ctx);
  const r    = ctx.r;
  drawHeader(page, ctx, "Form 8995", "Qualified Business Income Deduction (Simplified Computation)", r.taxYear);

  let y = 740;
  page.drawText("OMB No. 1545-2294   Attach to your tax return.", { x: 400, y, size: 7, font: ctx.reg, color: C.gray });

  y -= 16;
  page.drawText(r.taxpayerName, { x: 30, y, size: 10, font: ctx.bold, color: C.black });
  y -= 22;

  const netProfit = p(r.line8);
  const qbiAmt    = Math.round(netProfit * 0.20 * 100) / 100;

  const qbiLines: [string, string, string | null, any?][] = [
    ["1",  "Trade/business name: (from Schedule C)",                 null],
    ["2",  "Qualified business income (QBI) — net profit × 100%",  String(netProfit)],
    ["3",  "Gain or loss allocable to qualified payments",           null],
    ["4",  "Qualified business income from all trades/businesses",   String(netProfit)],
    ["5",  "QBI component: Multiply line 4 by 20% (0.20)",          String(qbiAmt)],
    ["6",  "Qualified REIT dividends and PTP income",                null],
    ["7",  "REIT/PTP component: Multiply line 6 by 20%",            null],
    ["8",  "QBI deduction before income limitation",                 String(qbiAmt)],
    ["9",  "Taxable income before QBI deduction",                    r.line15],
    ["10", "Net capital gain (qualified dividends + capital gains)", null],
    ["11", "Taxable income after subtracting net capital gain",      r.line15],
    ["12", "Income limitation: Multiply line 11 by 20%",            r.line15 ? String(Math.round(p(r.line15) * 0.20)) : null],
    ["13", "QUALIFIED BUSINESS INCOME DEDUCTION → 1040, line 13",  String(qbiAmt), { bold: true, color: C.blue }],
  ];
  for (const [n, label, val, opts] of qbiLines) {
    drawLine(page, ctx, y, n, label, val ?? undefined, opts ?? {});
    y -= 18;
  }

  y -= 10;
  page.drawRectangle({ x: 24, y: y - 20, width: 564, height: 24, color: C.light });
  page.drawText(
    "Note: QBI deduction may be limited if taxable income exceeds $191,950 (single) / $383,900 (MFJ) — Form 8995-A required.",
    { x: 30, y: y - 12, size: 7, font: ctx.reg, color: C.gray }
  );

  drawDivider(page, 36);
  page.drawText("Form 8995 (2024)  Cat. No. 75433P", { x: 24, y: 24, size: 7, font: ctx.reg, color: C.gray });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY COVER PAGE (Solar-branded)
// ═══════════════════════════════════════════════════════════════════════════════
function buildCoverPage(ctx: Ctx): void {
  const page = addPage(ctx);
  const r    = ctx.r;

  // Solar orange header
  page.drawRectangle({ x: 0, y: 742, width: 612, height: 50, color: C.sun });
  page.drawText("☀ SOLAR TAX ENGINE", { x: 24, y: 775, size: 14, font: ctx.bold, color: C.white });
  page.drawText("Electronic Filing Package", { x: 24, y: 760, size: 9, font: ctx.reg, color: rgb(1, 0.95, 0.85) });
  page.drawText(`Tax Year ${r.taxYear}`, { x: 500, y: 768, size: 12, font: ctx.bold, color: C.white });

  let y = 720;

  // Taxpayer block
  page.drawRectangle({ x: 24, y: y - 60, width: 564, height: 64, color: C.light, borderColor: C.border, borderWidth: 0.5 });
  page.drawText(r.taxpayerName, { x: 36, y: y - 12, size: 14, font: ctx.bold, color: C.black });
  if (r.spouseName) {
    page.drawText(`& ${r.spouseName}`, { x: 36, y: y - 26, size: 11, font: ctx.reg, color: C.gray });
  }
  page.drawText(r.filingStatus.replace(/_/g, " "), { x: 36, y: y - 40, size: 9, font: ctx.reg, color: C.blue });
  if (r.address) {
    page.drawText(r.address, { x: 36, y: y - 52, size: 8, font: ctx.reg, color: C.gray });
  }
  y -= 80;

  // Summary grid
  const isRefund = p(r.line34) > 0;
  const summaryItems = [
    { label: "Adjusted Gross Income",  val: r.line11 ?? "0", color: C.blue  },
    { label: "Total Tax (Line 24)",    val: r.line24 ?? "0", color: C.red   },
    { label: "Total Withholding",      val: r.line25d ?? "0", color: C.black },
    { label: isRefund ? "Refund" : "Amount Due",
      val: isRefund ? r.line34 ?? "0" : r.line37 ?? "0",
      color: isRefund ? C.green : C.red },
  ];
  const cols = 2;
  const cellW = 270, cellH = 60;
  summaryItems.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x   = 24 + col * (cellW + 12);
    const cy  = y - row * (cellH + 8);
    page.drawRectangle({ x, y: cy - cellH, width: cellW, height: cellH,
      color: C.light, borderColor: C.border, borderWidth: 0.5 });
    page.drawText(item.label.toUpperCase(), { x: x + 12, y: cy - 16, size: 7, font: ctx.bold, color: C.gray });
    const val = `$${Math.abs(p(item.val)).toLocaleString("en-US")}`;
    page.drawText(val, { x: x + 12, y: cy - 44, size: 22, font: ctx.bold, color: item.color });
  });
  y -= (Math.ceil(summaryItems.length / cols)) * (cellH + 8) + 20;

  // Forms included
  drawSectionBar(page, ctx, y, "Filing Package — Forms Included");
  y -= 20;
  const formsList = [
    "Form 8879  —  IRS e-file Signature Authorization",
    "Form 1040  —  U.S. Individual Income Tax Return (Page 1 + Page 2)",
    "Schedule 1  —  Additional Income and Adjustments",
    "Schedule 2  —  Additional Taxes",
    "Schedule C  —  Profit or Loss from Business (Primary)",
    "Schedule C  —  Profit or Loss from Business (Spouse)",
    "Schedule SE  —  Self-Employment Tax (Primary)",
    "Schedule SE  —  Self-Employment Tax (Spouse)",
    "Form 8995  —  Qualified Business Income Deduction",
  ];
  for (const form of formsList) {
    page.drawText("✓  " + form, { x: 36, y, size: 8.5, font: ctx.reg, color: C.black });
    y -= 16;
  }
  y -= 10;

  // Footer
  page.drawRectangle({ x: 0, y: 0, width: 612, height: 36, color: C.light });
  page.drawText("Generated by SolarTax ☀  —  solar-tax.vercel.app", { x: 24, y: 16, size: 8, font: ctx.bold, color: C.sun });
  page.drawText("For planning and filing preparation only. Not a substitute for professional tax advice.",
    { x: 24, y: 6, size: 7, font: ctx.reg, color: C.gray });
  page.drawText(`Generated: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`,
    { x: 400, y: 10, size: 7.5, font: ctx.reg, color: C.gray });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — generates full filing packet
// ═══════════════════════════════════════════════════════════════════════════════
export async function generateFilingPacket(report: IRS1040Report): Promise<Uint8Array> {
  const doc  = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg  = await doc.embedFont(StandardFonts.Helvetica);
  const mono = await doc.embedFont(StandardFonts.Courier);

  const ctx: Ctx = { doc, bold, reg, mono, r: report };

  // === FORM ORDER (official IRS packet order) ===
  buildCoverPage(ctx);      // Solar cover
  buildForm8879(ctx);       // 1. Authorization
  buildForm1040Page1(ctx);  // 2. 1040 Page 1
  buildForm1040Page2(ctx);  // 2. 1040 Page 2
  buildSchedule1(ctx);      // 3. Schedule 1
  buildSchedule2(ctx);      // 4. Schedule 2

  // Schedule C per taxpayer (primary + spouse if SE income exists)
  const netProfit = p(report.line8);
  const seTax     = p(report.line23);
  const deductible = p(report.line10);

  if (netProfit > 0) {
    buildScheduleC(ctx, report.taxpayerName, "Self-Employment Business",
      p(report.line8), 0, netProfit, seTax);    // 5. Schedule C primary
    buildScheduleSE(ctx, report.taxpayerName, netProfit, seTax, deductible); // 6. SE primary

    if (report.spouseName) {
      buildScheduleC(ctx, report.spouseName, "Self-Employment Business",
        0, 0, 0, 0);                             // 7. Schedule C spouse (empty if no data)
      buildScheduleSE(ctx, report.spouseName, 0, 0, 0); // 8. SE spouse
    }
  }

  buildForm8995(ctx);       // 9. QBI deduction

  // Metadata
  doc.setTitle(`Solar Tax ${report.taxYear} — ${report.taxpayerName}`);
  doc.setAuthor("SolarTax Engine ☀");
  doc.setSubject("IRS e-file Filing Packet");
  doc.setKeywords(["1040", "IRS", "Solar", String(report.taxYear)]);
  doc.setCreationDate(new Date());

  return doc.save();
}
