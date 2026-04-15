// app/api/pdf/8879/[taxYearId]/route.ts 
// Generates Form 8879 PDF using pdf-lib
// ERO: TLNC TRADE LLC · EIN 36-4986102 · Houston, TX s
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const C = {
  black:  rgb(0.05, 0.05, 0.08),
  blue:   rgb(0.07, 0.24, 0.56),
  gray:   rgb(0.40, 0.40, 0.44),
  light:  rgb(0.95, 0.96, 0.98),
  red:    rgb(0.70, 0.10, 0.10),
  green:  rgb(0.04, 0.45, 0.25),
  border: rgb(0.75, 0.77, 0.82),
  sun:    rgb(0.91, 0.46, 0.04),
  white:  rgb(1, 1, 1),
};

function money(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export async function GET(_req: Request, { params }: { params: { taxYearId: string } }) {
  try {
    const db  = prisma as any;
    const ty  = await db.taxYear.findUnique({
      where:   { id: params.taxYearId },
      include: {
        household:  true,
        scenarios:  { include: { result: true }, orderBy: { type: "asc" } },
        snapshot:   true,
      },
    });

    if (!ty) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Use snapshot if signed, else BALANCED scenario result
    let agi = 0, totalTax = 0, withholding = 0, refund = 0, amountDue = 0, effectiveRate = 0;

    if (ty.snapshot) {
      agi          = ty.snapshot.line11;
      totalTax     = ty.snapshot.line24;
      withholding  = ty.snapshot.line33;
      refund       = ty.snapshot.line34;
      amountDue    = ty.snapshot.line37;
      effectiveRate= ty.snapshot.effectiveRate;
    } else {
      const best   = ty.scenarios.find((s: any) => s.type === "BALANCED")?.result ?? ty.scenarios[0]?.result;
      if (best) {
        agi         = Number(best.agi);
        totalTax    = Number(best.taxOwed);
        withholding = Number(best.totalWithholding);
        refund      = Number(best.refund);
        amountDue   = Number(best.amountDue);
        effectiveRate = Number(best.effectiveRate);
      }
    }

    const isRefund   = refund > 0;
    const taxpayerName = ty.household?.name ?? "Taxpayer";
    const today      = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    // ── Build PDF ──────────────────────────────────────────────────
    const doc  = await PDFDocument.create();
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const reg  = await doc.embedFont(StandardFonts.Helvetica);
    const mono = await doc.embedFont(StandardFonts.Courier);

    const page = doc.addPage([612, 792]); // Letter
    const { width, height } = page.getSize();
    let y = height - 36;

    const line = (x: number, y1: number, x2: number, y2: number, color = C.border, thick = 0.5) => {
      page.drawLine({ start: { x, y: y1 }, end: { x: x2, y: y2 }, thickness: thick, color });
    };
    const rect = (x: number, yy: number, w: number, h: number, fill: typeof C.black) => {
      page.drawRectangle({ x, y: yy, width: w, height: h, color: fill });
    };
    const txt = (t: string, x: number, yy: number, size: number, font = reg, color = C.black) => {
      page.drawText(t, { x, y: yy, size, font, color });
    };

    // ── Header band ────────────────────────────────────────────────
    rect(0, y - 52, width, 52, C.blue);
    txt("Form 8879",                          36,  y - 16, 20, bold, C.white);
    txt("IRS e-file Signature Authorization", 36,  y - 32, 9,  reg,  rgb(0.7, 0.8, 1.0));
    txt("Department of the Treasury · Internal Revenue Service", 36, y - 44, 7, reg, rgb(0.6,0.7,0.9));
    // Tax year badge
    rect(width - 100, y - 44, 72, 18, C.sun);
    txt(`Tax Year ${ty.year}`, width - 94, y - 38, 9, bold, C.white);
    y -= 60;

    // ── ERO band ───────────────────────────────────────────────────
    rect(0, y - 18, width, 18, rgb(0.92, 0.93, 0.96));
    txt("ERO: TLNC TRADE LLC", 36, y - 13, 8, bold, C.blue);
    txt("EIN: 36-4986102",     200, y - 13, 8, reg,  C.gray);
    txt("Houston, TX",         310, y - 13, 8, reg,  C.gray);
    txt(today,                 width - 120, y - 13, 8, reg, C.gray);
    y -= 26;

    // ── PART I Header ──────────────────────────────────────────────
    rect(36, y - 16, width - 72, 16, rgb(0.07, 0.24, 0.56));
    txt("PART I — TAX RETURN INFORMATION (Whole Dollars Only)", 44, y - 12, 8, bold, C.white);
    y -= 24;

    // ── Part I table ───────────────────────────────────────────────
    const rows = [
      { num: "1", label: "Adjusted gross income",         ref: "Line 11", val: agi,          color: C.black },
      { num: "2", label: "Total tax",                     ref: "Line 24", val: totalTax,     color: C.red   },
      { num: "3", label: "Federal income tax withheld",   ref: "Line 25d",val: withholding,  color: C.black },
      { num: "4", label: isRefund ? "Refund" : "—",       ref: "Line 34", val: isRefund ? refund : 0, color: C.green },
      { num: "5", label: "Amount you owe",                ref: "Line 37", val: isRefund ? 0 : amountDue, color: C.red },
    ];

    for (let i = 0; i < rows.length; i++) {
      const r    = rows[i];
      const rowY = y - i * 22;
      const bg   = i % 2 === 0 ? C.white : C.light;
      rect(36, rowY - 16, width - 72, 22, bg);
      line(36, rowY - 16, width - 36, rowY - 16);
      txt(r.num,   44,          rowY - 10, 9,  bold, C.sun);
      txt(r.label, 60,          rowY - 10, 9,  reg,  C.black);
      txt(r.ref,   300,         rowY - 10, 7,  reg,  C.gray);
      txt(`$${money(r.val)}`,   width - 80, rowY - 10, 10, mono, r.color);
    }
    // bottom border
    line(36, y - rows.length * 22 - 4, width - 36, y - rows.length * 22 - 4, C.border, 1);
    y -= rows.length * 22 + 16;

    // ── Effective rate ─────────────────────────────────────────────
    rect(36, y - 14, width - 72, 14, rgb(0.95, 0.96, 0.98));
    txt(`Effective Tax Rate: ${effectiveRate.toFixed(1)}%`, 44, y - 10, 8, reg, C.gray);
    y -= 24;

    // ── PART II Header ─────────────────────────────────────────────
    rect(36, y - 16, width - 72, 16, C.blue);
    txt("PART II — DECLARATION AND SIGNATURE AUTHORIZATION", 44, y - 12, 8, bold, C.white);
    y -= 24;

    // Declaration text
    const decl = `Under penalties of perjury, I declare that I have examined this return and to the best of my knowledge it is true, correct, and complete. I authorize TLNC TRADE LLC (EIN 36-4986102) to enter or generate my PIN as my electronic signature on my ${ty.year} federal income tax return.`;
    const words = decl.split(" ");
    let lineStr = "";
    let dy = 0;
    for (const w of words) {
      const test = lineStr ? `${lineStr} ${w}` : w;
      if (reg.widthOfTextAtSize(test, 8.5) > width - 100) {
        txt(lineStr, 44, y - dy, 8.5, reg, C.black);
        dy += 13;
        lineStr = w;
      } else {
        lineStr = test;
      }
    }
    if (lineStr) { txt(lineStr, 44, y - dy, 8.5, reg, C.black); dy += 13; }
    y -= dy + 16;

    // ── ERO & Taxpayer Signature lines ─────────────────────────────
    rect(36, y - 50, width - 72, 50, C.light);
    line(36, y - 50, width - 36, y - 50, C.border, 0.5);

    // ERO
    txt("ERO Signature:",   44,  y - 16, 8,  bold, C.gray);
    txt("TLNC TRADE LLC",   150, y - 16, 9,  bold, C.blue);
    txt("Date signed:",     44,  y - 30, 8,  reg,  C.gray);
    txt(today,              150, y - 30, 8,  reg,  C.black);
    txt("Authorized e-file provider", 44, y - 44, 7, reg, C.gray);

    // Taxpayer signature area
    txt("Taxpayer Signature:", width / 2 + 10, y - 16, 8, bold, C.gray);
    txt(taxpayerName,          width / 2 + 120, y - 16, 9, bold, C.black);
    txt("(Electronic PIN)",    width / 2 + 10,  y - 30, 7, reg,  C.gray);
    txt("Date: " + today,      width / 2 + 10,  y - 44, 7, reg,  C.gray);

    line(36, y, width - 36, y, C.border, 0.5);
    y -= 60;

    // ── Footer ─────────────────────────────────────────────────────
    line(36, 50, width - 36, 50, C.border, 0.5);
    txt("Form 8879 (Solar Tax Engine) · For planning purposes only · Consult a licensed CPA before filing",
      36, 36, 7, reg, C.gray);
    txt(`Generated: ${today}`, width - 150, 36, 7, reg, C.gray);

    // ── Snapshot badge (if signed) ─────────────────────────────────
    if (ty.snapshot) {
      rect(36, 55, 200, 14, rgb(0.04, 0.50, 0.31));
      txt(`🔒 SIGNED · Hash: ${ty.snapshot.hash.substring(0, 12)}…`, 42, 60, 7, bold, C.white);
    }

    const bytes = await doc.save();
    return new Response(bytes, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="Form8879_${ty.year}_${params.taxYearId.slice(0, 6)}.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
