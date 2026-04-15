// app/page.tsx
// Главная страница — сразу Form 8879 + Form 1040 с живыми данными
// Тестовый режим: грузим первый tax year или показываем форму выбора ы
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { calculate } from "@/lib/tax/calc";
import Link from "next/link";
import { loadDemo } from "@/actions/demo";

function fmt(n: number) {
  return "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
}

function money(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

export default async function HomePage() {
  const db = prisma as any;

  // Берём первый tax year (demo или реальный)
  const taxYear = await db.taxYear.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      household:    true,
      incomeItems:  true,
      expenseItems: true,
      dependents:   true,
      scenarios:    { include: { result: true }, orderBy: { type: "asc" } },
      snapshot:     true,
    },
  });

  const taxpayers = taxYear ? await prisma.taxpayer.findMany({
    where:   { householdId: taxYear.householdId },
    orderBy: { isPrimary: "desc" },
  }) : [];

  // ── Live calculation ──────────────────────────────────────────────────────
  let c: ReturnType<typeof calculate> | null = null;

  if (taxYear) {
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

    c = calculate({
      filingStatus:      taxYear.filingStatus ?? "MARRIED_FILING_JOINTLY",
      w2Income, seNetProfit,
      w2Withholding: w2Wh, n99Withholding: n99Wh,
      estimatedPayments: 0, numChildren,
    });
  }

  const today = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric"
  });

  const primary = taxpayers.find((t: any) =>  t.isPrimary) ?? taxpayers[0];
  const spouse  = taxpayers.find((t: any) => !t.isPrimary) ?? null;
  const isMFJ   = taxYear?.filingStatus === "MARRIED_FILING_JOINTLY";

  // ── Styles ────────────────────────────────────────────────────────────────
  const blue   = "#1a3a6b";
  const border = "#e5e7eb";
  const muted  = "#6b7280";
  const red    = "#b91c1c";
  const green  = "#15803d";
  const sun    = "#c45400";

  const cardStyle = {
    border: `1px solid ${border}`, borderRadius: 12,
    overflow: "hidden", marginBottom: 24, background: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  } as const;

  const headStyle = {
    background: blue, padding: "14px 20px",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  } as const;

  const sectionHead = {
    padding: "7px 20px", background: `${blue}ee`,
    color: "#fff", fontSize: 9, fontWeight: 700,
    letterSpacing: 1, textTransform: "uppercase" as const,
  };

  const lineStyle = (highlight = false) => ({
    display: "flex", alignItems: "baseline",
    padding: "8px 20px", borderBottom: `1px solid ${border}`,
    background: highlight ? "rgba(26,58,107,0.04)" : "#fff",
  } as const);

  if (!taxYear) {
    // No data yet — show quick start
    return (
      <div style={{ minHeight: "100vh", background: "#fafaf8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>☀</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Solar Tax Engine</h1>
          <p style={{ color: muted, marginBottom: 32 }}>No tax data yet. Load the demo to see all forms with real numbers.</p>
          <form action={loadDemo}>
            <button type="submit" style={{
              padding: "14px 32px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${sun}, #a13800)`,
              color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
              width: "100%",
            }}>
              ☀ Load Demo Data →
            </button>
          </form>
          <Link href="/dashboard" style={{ display: "block", marginTop: 16, color: muted, fontSize: 13, textDecoration: "none" }}>
            Or enter my own data →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "system-ui, sans-serif", color: "#111" }}>

      {/* ── Top nav ──────────────────────────────────────────────────────────── */}
      <nav style={{
        background: blue, padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>☀ Solar Tax Engine</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", padding: "2px 8px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10 }}>
            {taxYear.household?.name}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href={`/tax-year/${taxYear.id}/fast-file`} style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
            Fast File
          </Link>
          <Link href={`/tax-year/${taxYear.id}/wizard/sign`} style={{
            padding: "7px 16px", borderRadius: 8, border: "none",
            background: sun, color: "#fff", fontSize: 12, fontWeight: 700,
            textDecoration: "none",
          }}>
            Start Filing →
          </Link>
          <Link href="/dashboard" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
            Dashboard
          </Link>
        </div>
      </nav>

      {/* ── Summary bar ──────────────────────────────────────────────────────── */}
      {c && (
        <div style={{
          background: "#1e2d4a", padding: "10px 24px",
          display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center",
        }}>
          {[
            { l: "Total Income",   v: fmt(c.line9),   note: "Line 9" },
            { l: "AGI",            v: fmt(c.line11),  note: "Line 11" },
            { l: "Taxable Income", v: fmt(c.line15),  note: "Line 15" },
            { l: "Total Tax",      v: fmt(c.line24),  note: "Line 24", r: true },
            { l: "Withholding",    v: fmt(c.line25d), note: "Line 25d" },
            { l: c.isRefund ? "Refund" : "Amount Due",
              v: c.isRefund ? fmt(c.line34) : fmt(c.line37),
              note: c.isRefund ? "Line 34" : "Line 37",
              g: c.isRefund, r: !c.isRefund },
            { l: "Eff. Rate", v: c.effectiveRate.toFixed(1) + "%", note: "Tax/Income" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 13, fontWeight: 800, color: (s as any).r ? "#fca5a5" : (s as any).g ? "#86efac" : "#fff" }}>{s.v}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{s.l} · {s.note}</div>
            </div>
          ))}
          <div style={{ marginLeft: "auto" }}>
            <Link href={`/tax-year/${taxYear.id}/wizard/sign`} style={{
              padding: "7px 18px", borderRadius: 8,
              background: `linear-gradient(135deg, ${sun}, #a13800)`,
              color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none",
            }}>
              Sign & File →
            </Link>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* ══════════════════════════════════════════════════════════════════════
            FORM 8879 — e-file Signature Authorization
        ══════════════════════════════════════════════════════════════════════ */}
        <div style={cardStyle}>
          <div style={headStyle}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 900, color: "#fff" }}>Form 8879</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                IRS e-file Signature Authorization
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>OMB No. 1545-0074</div>
              <div style={{ marginTop: 4, padding: "2px 8px", background: `${sun}99`, borderRadius: 4, fontSize: 10, fontWeight: 700, color: "#fff" }}>
                Tax Year {taxYear.year}
              </div>
            </div>
          </div>

          {/* ERO */}
          <div style={{ padding: "8px 20px", background: "#eef0f6", borderBottom: `1px solid ${border}`, display: "flex", gap: 20, flexWrap: "wrap", fontSize: 11 }}>
            <span><span style={{ color: muted }}>ERO: </span><strong>TLNC TRADE LLC</strong></span>
            <span><span style={{ color: muted }}>EIN: </span>36-4986102</span>
            <span><span style={{ color: muted }}>Location: </span>Houston, TX</span>
          </div>

          {/* Taxpayer info */}
          <div style={{ padding: "10px 20px", borderBottom: `1px solid ${border}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
            <div style={{ fontSize: 11 }}>
              <span style={{ color: muted }}>Taxpayer: </span>
              <strong>{primary ? `${primary.firstName} ${primary.lastName}` : taxYear.household?.name}</strong>
            </div>
            {isMFJ && spouse && (
              <div style={{ fontSize: 11 }}>
                <span style={{ color: muted }}>Spouse: </span>
                <strong>{spouse.firstName} {spouse.lastName}</strong>
              </div>
            )}
            <div style={{ fontSize: 11 }}>
              <span style={{ color: muted }}>Filing Status: </span>
              {taxYear.filingStatus?.replace(/_/g, " ")}
            </div>
            <div style={{ fontSize: 11 }}>
              <span style={{ color: muted }}>Date: </span>{today}
            </div>
          </div>

          {/* Part I */}
          <div style={sectionHead}>Part I — Tax Return Information (Whole Dollars Only)</div>

          {c && [
            { num: "1", label: "Adjusted gross income",         ref: "Line 11",  val: c.line11,  formula: "line9 − line10" },
            { num: "2", label: "Total tax",                     ref: "Line 24",  val: c.line24,  formula: "line22 + SE tax", isRed: true },
            { num: "3", label: "Federal income tax withheld",   ref: "Line 25d", val: c.line25d, formula: "W-2 wh + 1099 wh" },
            { num: "4", label: "Refund",                        ref: "Line 34",  val: c.line34,  formula: "line33 − line24", isGreen: c.isRefund },
            { num: "5", label: "Amount you owe",                ref: "Line 37",  val: c.line37,  formula: "line24 − line33", isRed: !c.isRefund, bold: !c.isRefund },
          ].map((row, i) => (
            <div key={i} style={lineStyle(row.bold)}>
              <span style={{ width: 24, fontSize: 11, fontWeight: 800, color: sun }}>{row.num}</span>
              <span style={{ flex: 1, fontSize: 12 }}>
                {row.label}
                <span style={{ marginLeft: 8, fontSize: 9, color: "#9ca3af" }}>{row.ref}</span>
                <span style={{ marginLeft: 8, fontSize: 9, color: "#c4b5a5", fontFamily: "monospace" }}>= {row.formula}</span>
              </span>
              <span style={{
                fontSize: row.bold ? 15 : 13, fontWeight: row.bold ? 800 : 600,
                fontFamily: "monospace",
                color: (row as any).isRed ? red : (row as any).isGreen ? green : "#111",
              }}>
                ${money(row.val)}
              </span>
            </div>
          ))}

          {/* Part II */}
          <div style={sectionHead}>Part II — Declaration and Signature Authorization</div>
          <div style={{ padding: "12px 20px", fontSize: 11, color: muted, lineHeight: 1.8, borderBottom: `1px solid ${border}` }}>
            Under penalties of perjury, I declare that I have examined this return and to the best of my knowledge it is true, correct, and complete.
            I authorize <strong style={{ color: "#111" }}>TLNC TRADE LLC</strong> (EIN 36-4986102) to enter or generate my PIN as my electronic signature on my {taxYear.year} federal income tax return.
          </div>

          <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: muted }}>
              {taxYear.snapshot ? "🔒 Signed · Hash " + String(taxYear.snapshot.hash ?? "").slice(0, 12) + "…" : "⬜ Not yet signed"}
            </span>
            <Link href={`/tax-year/${taxYear.id}/sign`} style={{
              padding: "9px 22px", borderRadius: 8, border: "none",
              background: taxYear.snapshot ? "#16a34a" : `linear-gradient(135deg, ${sun}, #a13800)`,
              color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none",
            }}>
              {taxYear.snapshot ? "✓ Signed" : "🔐 Sign Form 8879 →"}
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            FORM 1040 — U.S. Individual Income Tax Return
        ══════════════════════════════════════════════════════════════════════ */}
        {c && (
          <div style={cardStyle}>
            <div style={headStyle}>
              <div>
                <div style={{ fontSize: 19, fontWeight: 900, color: "#fff" }}>Form 1040</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                  U.S. Individual Income Tax Return
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>OMB No. 1545-0074</div>
                <div style={{ marginTop: 4, padding: "2px 8px", background: `${sun}99`, borderRadius: 4, fontSize: 10, fontWeight: 700, color: "#fff" }}>
                  Tax Year {taxYear.year}
                </div>
              </div>
            </div>

            {/* Filing info */}
            <div style={{ padding: "10px 20px", borderBottom: `1px solid ${border}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
              <div style={{ fontSize: 11 }}><span style={{ color: muted }}>Name: </span><strong>{primary ? `${primary.firstName} ${primary.lastName}` : taxYear.household?.name}</strong></div>
              {isMFJ && spouse && <div style={{ fontSize: 11 }}><span style={{ color: muted }}>Spouse: </span><strong>{spouse.firstName} {spouse.lastName}</strong></div>}
              <div style={{ fontSize: 11 }}><span style={{ color: muted }}>Filing Status: </span>{"✓ " + taxYear.filingStatus?.replace(/_/g, " ")}</div>
              <div style={{ fontSize: 11 }}><span style={{ color: muted }}>Dependents: </span>{taxYear.dependents?.map((d: any) => d.firstName).join(", ") || "None"}</div>
            </div>

            {/* Income section */}
            <div style={sectionHead}>Income</div>
            {[
              { num: "1a",  label: "W-2 wages",                          val: c.line1a,  formula: "sum W-2 income items" },
              { num: "7a",  label: "Capital gain or (loss) — Schedule D", val: 0,         formula: "Schedule D Line 16" },
              { num: "8",   label: "Additional income — Schedule 1",      val: c.line8,   formula: "Schedule C net profit" },
              { num: "9",   label: "Total income",                        val: c.line9,   formula: "1a + 7a + 8", bold: true },
              { num: "10",  label: "Adjustments — Schedule 1 Line 26",    val: c.line10,  formula: "½ SE tax deduction" },
              { num: "11",  label: "Adjusted gross income (AGI)",         val: c.line11,  formula: "line9 − line10", bold: true, highlight: true },
            ].map((row, i) => (
              <div key={i} style={lineStyle(row.highlight || row.bold)}>
                <span style={{ width: 28, fontSize: 10, fontWeight: 700, color: sun }}>{row.num}</span>
                <span style={{ flex: 1, fontSize: 12 }}>
                  {row.label}
                  <span style={{ marginLeft: 8, fontSize: 9, color: "#c4b5a5", fontFamily: "monospace" }}>= {row.formula}</span>
                </span>
                <span style={{ fontSize: row.bold ? 14 : 12, fontWeight: row.bold ? 800 : 600, fontFamily: "monospace", color: row.highlight ? blue : "#111" }}>
                  ${money(row.val)}
                </span>
              </div>
            ))}

            {/* Tax & Credits */}
            <div style={sectionHead}>Tax and Credits</div>
            {[
              { num: "11b", label: "AGI (from line 11)",                val: c.line11,  formula: "= line 11" },
              { num: "12e", label: "Standard deduction",               val: c.line12,  formula: isMFJ ? "$29,200 MFJ 2024" : "$14,600 Single" },
              { num: "13a", label: "QBI deduction — Form 8995",         val: c.line13,  formula: "min(SE×20%, taxable×20%)" },
              { num: "14",  label: "Total deductions",                  val: c.line14,  formula: "12e + 13a" },
              { num: "15",  label: "Taxable income",                    val: c.line15,  formula: "11b − 14", bold: true, highlight: true },
              { num: "16",  label: "Income tax (tax brackets)",         val: c.line16,  formula: `${taxYear.filingStatus} brackets` },
              { num: "19",  label: "Child tax credit — Schedule 8812",  val: c.line19,  formula: `${taxYear.dependents?.length ?? 0} children × $2,000`, isGreen: c.line19 > 0 },
              { num: "22",  label: "Tax after credits",                 val: c.line22,  formula: "16 − 19" },
              { num: "23",  label: "SE tax — Schedule 2 Line 21",       val: c.line23,  formula: "SE earnings × 15.3%", isRed: true },
              { num: "24",  label: "Total tax",                         val: c.line24,  formula: "22 + 23", bold: true, isRed: true },
            ].map((row, i) => (
              <div key={i} style={lineStyle(row.highlight)}>
                <span style={{ width: 28, fontSize: 10, fontWeight: 700, color: sun }}>{row.num}</span>
                <span style={{ flex: 1, fontSize: 12 }}>
                  {row.label}
                  <span style={{ marginLeft: 8, fontSize: 9, color: "#c4b5a5", fontFamily: "monospace" }}>= {row.formula}</span>
                </span>
                <span style={{
                  fontSize: row.bold ? 14 : 12, fontWeight: row.bold ? 800 : 600,
                  fontFamily: "monospace",
                  color: (row as any).isRed ? red : (row as any).isGreen ? green : row.highlight ? blue : "#111",
                }}>
                  ${money(row.val)}
                </span>
              </div>
            ))}

            {/* Payments */}
            <div style={sectionHead}>Payments</div>
            {[
              { num: "25a", label: "W-2 withholding",         val: c.line25a, formula: "sum W-2 withholding" },
              { num: "25b", label: "1099 withholding",        val: c.line25b, formula: "sum 1099 withholding" },
              { num: "25d", label: "Total withholding",       val: c.line25d, formula: "25a + 25b" },
              { num: "26",  label: "Estimated tax payments",  val: c.line26,  formula: "from Form 1040-ES" },
              { num: "33",  label: "Total payments",          val: c.line33,  formula: "25d + 26", bold: true },
            ].map((row, i) => (
              <div key={i} style={lineStyle()}>
                <span style={{ width: 28, fontSize: 10, fontWeight: 700, color: sun }}>{row.num}</span>
                <span style={{ flex: 1, fontSize: 12 }}>
                  {row.label}
                  <span style={{ marginLeft: 8, fontSize: 9, color: "#c4b5a5", fontFamily: "monospace" }}>= {row.formula}</span>
                </span>
                <span style={{ fontSize: row.bold ? 14 : 12, fontWeight: row.bold ? 800 : 600, fontFamily: "monospace" }}>
                  ${money(row.val)}
                </span>
              </div>
            ))}

            {/* Result */}
            <div style={sectionHead}>Result</div>
            <div style={lineStyle(c.isRefund)}>
              <span style={{ width: 28, fontSize: 10, fontWeight: 700, color: sun }}>34</span>
              <span style={{ flex: 1, fontSize: 12 }}>
                Refund
                <span style={{ marginLeft: 8, fontSize: 9, color: "#c4b5a5", fontFamily: "monospace" }}>= line33 − line24 (if positive)</span>
              </span>
              <span style={{ fontSize: c.isRefund ? 16 : 12, fontWeight: 800, fontFamily: "monospace", color: c.isRefund ? green : muted }}>
                ${money(c.line34)}
              </span>
            </div>
            <div style={lineStyle(!c.isRefund)}>
              <span style={{ width: 28, fontSize: 10, fontWeight: 700, color: sun }}>37</span>
              <span style={{ flex: 1, fontSize: 12 }}>
                Amount you owe
                <span style={{ marginLeft: 8, fontSize: 9, color: "#c4b5a5", fontFamily: "monospace" }}>= line24 − line33 (if positive)</span>
              </span>
              <span style={{ fontSize: !c.isRefund ? 16 : 12, fontWeight: 800, fontFamily: "monospace", color: !c.isRefund ? red : muted }}>
                ${money(c.line37)}
              </span>
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 20px", background: "#f8f9fa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: muted }}>
                Effective rate: <strong style={{ color: "#111" }}>{c.effectiveRate.toFixed(1)}%</strong>
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <Link href={`/api/report/${taxYear.id}`} style={{
                  padding: "8px 18px", borderRadius: 8,
                  border: `1px solid ${border}`,
                  color: blue, fontSize: 12, fontWeight: 700,
                  textDecoration: "none", background: "#fff",
                }}>
                  📄 PDF
                </Link>
                <Link href={`/tax-year/${taxYear.id}/wizard/form1040`} style={{
                  padding: "8px 18px", borderRadius: 8,
                  background: blue, color: "#fff",
                  fontSize: 12, fontWeight: 700, textDecoration: "none",
                }}>
                  Full 1040 →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick nav to other forms */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "Schedule C", href: `/tax-year/${taxYear.id}/wizard/scheduleC` },
            { label: "Schedule SE", href: `/tax-year/${taxYear.id}/wizard/scheduleSE` },
            { label: "Form 8995", href: `/tax-year/${taxYear.id}/wizard/form8995` },
            { label: "Form 8829", href: `/tax-year/${taxYear.id}/wizard/form8829` },
            { label: "All Forms", href: `/tax-year/${taxYear.id}/forms` },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{
              padding: "7px 14px", borderRadius: 8,
              border: `1px solid ${border}`, background: "#fff",
              fontSize: 11, fontWeight: 600, color: blue,
              textDecoration: "none",
            }}>
              {l.label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
