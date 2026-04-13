// lib/reporting/pdf.ts
// Generates client-ready IRS 1040 summary PDF using pdf-lib

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { IRS1040Report } from "./types";
import { fmtDollar, expenseCategoryLabel } from "./format";

const DARK  = rgb(0.07, 0.07, 0.12);
const BLUE  = rgb(0.06, 0.35, 0.65);
const GREEN = rgb(0.05, 0.55, 0.35);
const RED   = rgb(0.75, 0.15, 0.15);
const GRAY  = rgb(0.55, 0.55, 0.60);
const LIGHT = rgb(0.96, 0.97, 0.99);
const WHITE = rgb(1, 1, 1);

export async function generateReportPDF(report: IRS1040Report): Promise<Uint8Array> {
  const doc  = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg  = await doc.embedFont(StandardFonts.Helvetica);

  // Page 1 — Summary
  const p1 = doc.addPage([612, 792]);
  let y = 750;

  // Header bar
  p1.drawRectangle({ x: 0, y: 762, width: 612, height: 30, color: BLUE });
  p1.drawText("SOLAR TAX ENGINE — IRS 1040 PLANNING REPORT", {
    x: 24, y: 771, size: 10, font: bold, color: WHITE,
  });
  p1.drawText(`Generated: ${new Date(report.generatedAt).toLocaleDateString()}`, {
    x: 420, y: 771, size: 8, font: reg, color: WHITE,
  });

  y = 738;

  // Taxpayer info
  p1.drawText(report.taxpayerName, { x: 24, y, size: 16, font: bold, color: DARK });
  y -= 18;
  p1.drawText(`Tax Year ${report.taxYear}  ·  ${report.filingStatus}  ·  Scenario: ${report.scenarioUsed}`, {
    x: 24, y, size: 10, font: reg, color: GRAY,
  });
  y -= 24;

  // Divider
  p1.drawLine({ start: { x: 24, y }, end: { x: 588, y }, thickness: 1, color: BLUE });
  y -= 20;

  // Summary cards (2x3 grid)
  const cards = [
    { label: "Total Income",     value: report.line9,   color: DARK  },
    { label: "AGI",              value: report.line11,  color: DARK  },
    { label: "Taxable Income",   value: report.line15,  color: DARK  },
    { label: "Total Tax",        value: report.line24,  color: RED   },
    { label: "Withholding",      value: report.line25d, color: DARK  },
    { label: report.line37 ? "Amount Owed" : "Refund",
      value: report.line37 ?? report.line35a,
      color: report.line37 ? RED : GREEN },
  ];

  const cw = 185, ch = 60, cx0 = 24, gap = 10;
  cards.forEach((c, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = cx0 + col * (cw + gap);
    const cy = y - row * (ch + gap);
    p1.drawRectangle({ x: cx, y: cy - ch, width: cw, height: ch, color: LIGHT, borderColor: rgb(0.85,0.87,0.93), borderWidth: 1 });
    p1.drawText(c.label, { x: cx + 10, y: cy - 18, size: 8, font: reg, color: GRAY });
    p1.drawText("$" + fmtDollar(c.value ?? "0"), { x: cx + 10, y: cy - 42, size: 18, font: bold, color: c.color });
  });

  y -= (ch + gap) * 2 + 30;

  // 1040 Lines table
  p1.drawText("IRS FORM 1040 — LINE SUMMARY", { x: 24, y, size: 9, font: bold, color: BLUE });
  y -= 14;
  p1.drawLine({ start: { x: 24, y }, end: { x: 588, y }, thickness: 0.5, color: rgb(0.8,0.85,0.93) });
  y -= 14;

  const lines: [string, string | undefined][] = [
    ["Line 1a — W-2 Wages",                    report.line1a],
    ["Line 8 — Additional Income (Schedule 1)", report.line8],
    ["Line 9 — Total Income",                  report.line9],
    ["Line 10 — Adjustments to Income",        report.line10],
    ["Line 11 — Adjusted Gross Income (AGI)",  report.line11],
    ["Line 12 — Standard Deduction",           report.line12],
    ["Line 14 — Total Deductions",             report.line14],
    ["Line 15 — Taxable Income",               report.line15],
    ["Line 16 — Income Tax",                   report.line16],
    ["Line 19 — Child Tax Credit",             report.line19],
    ["Line 22 — Tax After Credits",            report.line22],
    ["Line 23 — Self-Employment Tax",          report.line23],
    ["Line 24 — Total Tax",                    report.line24],
    ["Line 25d — Total Withholding",           report.line25d],
    ["Line 33 — Total Payments",               report.line33],
    ["Line 35a — Refund",                      report.line35a],
    ["Line 37 — Amount You Owe",               report.line37],
  ];

  lines.forEach(([label, value], i) => {
    if (!value) return;
    const bg = i % 2 === 0 ? LIGHT : WHITE;
    p1.drawRectangle({ x: 24, y: y - 14, width: 564, height: 16, color: bg });
    const isTotal = label.includes("Total Tax") || label.includes("Owe") || label.includes("Refund");
    p1.drawText(label, { x: 30, y: y - 11, size: 8, font: isTotal ? bold : reg, color: isTotal ? DARK : GRAY });
    p1.drawText("$" + fmtDollar(value), { x: 540, y: y - 11, size: 8, font: isTotal ? bold : reg, color: isTotal ? (label.includes("Refund") ? GREEN : RED) : DARK });
    y -= 16;
  });

  y -= 20;

  // Page 2 — Source Breakdown
  const p2 = doc.addPage([612, 792]);
  y = 750;

  p2.drawRectangle({ x: 0, y: 762, width: 612, height: 30, color: BLUE });
  p2.drawText("INCOME & EXPENSE DETAIL", { x: 24, y: 771, size: 10, font: bold, color: WHITE });
  p2.drawText(report.taxpayerName + " — " + report.taxYear, { x: 400, y: 771, size: 8, font: reg, color: WHITE });

  y = 738;

  // Income items
  p2.drawText("INCOME", { x: 24, y, size: 9, font: bold, color: BLUE });
  y -= 14;
  p2.drawRectangle({ x: 24, y: y - 14, width: 564, height: 16, color: BLUE });
  p2.drawText("Type", { x: 30, y: y - 11, size: 8, font: bold, color: WHITE });
  p2.drawText("Source", { x: 130, y: y - 11, size: 8, font: bold, color: WHITE });
  p2.drawText("Amount", { x: 440, y: y - 11, size: 8, font: bold, color: WHITE });
  p2.drawText("Withholding", { x: 510, y: y - 11, size: 8, font: bold, color: WHITE });
  y -= 16;

  report.incomeItems.forEach((item, i) => {
    const bg = i % 2 === 0 ? LIGHT : WHITE;
    p2.drawRectangle({ x: 24, y: y - 14, width: 564, height: 16, color: bg });
    p2.drawText(item.type, { x: 30, y: y - 11, size: 8, font: reg, color: GRAY });
    p2.drawText(item.source.slice(0, 30), { x: 130, y: y - 11, size: 8, font: reg, color: DARK });
    p2.drawText("$" + fmtDollar(item.amount), { x: 440, y: y - 11, size: 8, font: reg, color: DARK });
    p2.drawText("$" + fmtDollar(item.withholding), { x: 530, y: y - 11, size: 8, font: reg, color: DARK });
    y -= 16;
  });

  y -= 20;

  // Expense items
  p2.drawText("EXPENSES", { x: 24, y, size: 9, font: bold, color: BLUE });
  y -= 14;
  p2.drawRectangle({ x: 24, y: y - 14, width: 564, height: 16, color: BLUE });
  p2.drawText("Category", { x: 30, y: y - 11, size: 8, font: bold, color: WHITE });
  p2.drawText("Description", { x: 150, y: y - 11, size: 8, font: bold, color: WHITE });
  p2.drawText("Amount", { x: 380, y: y - 11, size: 8, font: bold, color: WHITE });
  p2.drawText("Biz%", { x: 450, y: y - 11, size: 8, font: bold, color: WHITE });
  p2.drawText("Allowed", { x: 510, y: y - 11, size: 8, font: bold, color: WHITE });
  y -= 16;

  report.expenseItems.forEach((item, i) => {
    const bg = i % 2 === 0 ? LIGHT : WHITE;
    p2.drawRectangle({ x: 24, y: y - 14, width: 564, height: 16, color: bg });
    p2.drawText(expenseCategoryLabel(item.category), { x: 30, y: y - 11, size: 8, font: reg, color: GRAY });
    p2.drawText(item.description.slice(0, 24), { x: 150, y: y - 11, size: 8, font: reg, color: DARK });
    p2.drawText("$" + fmtDollar(item.amount), { x: 380, y: y - 11, size: 8, font: reg, color: DARK });
    p2.drawText(item.businessPct + "%", { x: 460, y: y - 11, size: 8, font: reg, color: DARK });
    p2.drawText("$" + fmtDollar(item.allowed), { x: 510, y: y - 11, size: 8, font: bold, color: GREEN });
    y -= 16;
  });

  // Dependents
  if (report.dependents.length > 0) {
    y -= 20;
    p2.drawText("DEPENDENTS", { x: 24, y, size: 9, font: bold, color: BLUE });
    y -= 14;
    report.dependents.forEach((d, i) => {
      const bg = i % 2 === 0 ? LIGHT : WHITE;
      p2.drawRectangle({ x: 24, y: y - 14, width: 564, height: 16, color: bg });
      p2.drawText(`${d.firstName} ${d.lastName}`, { x: 30, y: y - 11, size: 8, font: reg, color: DARK });
      p2.drawText(d.relationship, { x: 200, y: y - 11, size: 8, font: reg, color: GRAY });
      p2.drawText(`${d.months} months`, { x: 400, y: y - 11, size: 8, font: reg, color: GRAY });
      y -= 16;
    });
  }

  // Footer disclaimer
  const fy = 30;
  p2.drawLine({ start: { x: 24, y: fy + 14 }, end: { x: 588, y: fy + 14 }, thickness: 0.5, color: GRAY });
  p2.drawText("For tax planning purposes only. Not a filed return. Consult a licensed CPA before filing.", {
    x: 24, y: fy, size: 7, font: reg, color: GRAY,
  });
  p2.drawText("Solar Tax Engine — solar-tax.vercel.app", {
    x: 420, y: fy, size: 7, font: reg, color: GRAY,
  });

  return doc.save();
}
