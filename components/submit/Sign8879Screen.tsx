"use client";
// components/submit/Sign8879Screen.tsx
// Form 8879 — IRS e-file Signature Authorization
// ERO: TLNC TRADE LLC · EIN: 36-4986102 · Houston, TX s

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TaxYear  = any;
type Taxpayer = any;

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

export function Sign8879Screen({
  taxYear,
  taxpayers,
  wizardMode = false,
}: {
  taxYear:     TaxYear;
  taxpayers:   Taxpayer[];
  wizardMode?: boolean;
}) {
  const router = useRouter();

  const [primaryPin,  setPrimaryPin]  = useState("");
  const [confirmPin,  setConfirmPin]  = useState("");
  const [spousePin,   setSpousePin]   = useState("");
  const [confirmSP,   setConfirmSP]   = useState("");
  const [agree,       setAgree]       = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [step,        setStep]        = useState<"form" | "success">("form");

  const isMFJ   = taxYear.filingStatus === "MARRIED_FILING_JOINTLY";
  const primary = taxpayers.find((t: any) =>  t.isPrimary) ?? taxpayers[0];
  const spouse  = taxpayers.find((t: any) => !t.isPrimary) ?? null;

  const [firstName,       setFirstName]       = useState(primary?.firstName  ?? "");
  const [lastName,        setLastName]        = useState(primary?.lastName   ?? "");
  const [ssn,             setSsn]             = useState("");
  const [spouseFirstName, setSpouseFirstName] = useState(spouse?.firstName   ?? "");
  const [spouseLastName,  setSpouseLastName]  = useState(spouse?.lastName    ?? "");
  const [spouseSsn,       setSpouseSsn]       = useState("");

  // ── Data from BALANCED scenario result — Float DB ────────────────
  const scenarios   = taxYear.scenarios ?? [];
  const best        = scenarios.find((s: any) => s.type === "BALANCED")?.result
                   ?? scenarios[0]?.result;

  // Float fields — no parseFloat needed
  const agi         = Number(best?.agi              ?? 0);
  const totalTax    = Number(best?.taxOwed          ?? 0);
  const withholding = Number(best?.totalWithholding ?? 0);
  const refund      = Number(best?.refund           ?? 0);
  const amountDue   = Number(best?.amountDue        ?? 0);
  const isRefund    = refund > 0;

  const primaryOk = primaryPin.length === 5 && /^\d{5}$/.test(primaryPin) && primaryPin === confirmPin;
  const spouseOk  = !isMFJ ? true :
    spousePin.length === 5 && /^\d{5}$/.test(spousePin) && spousePin === confirmSP;
  const valid     = primaryOk && spouseOk && agree;

  const today = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const handleSign = async () => {
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const body: any = { primaryPin };
      if (isMFJ && spousePin) body.spousePin = spousePin;
      const res  = await fetch(`/api/sign/${taxYear.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Signing failed");
      setStep("success");
      setTimeout(() => {
        router.push(wizardMode
          ? `/tax-year/${taxYear.id}/wizard/form1040`
          : `/tax-year/${taxYear.id}/submit`
        );
      }, 1800);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/pdf/8879/${taxYear.id}`);
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `Form8879_${taxYear.year}_${taxYear.id.slice(0, 6)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPdfLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--solar-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--solar-text)", marginBottom: 8 }}>
            Form 8879 Signed
          </h1>
          <p style={{ color: "var(--solar-muted)", fontSize: 14, marginBottom: 4 }}>
            Authorization complete · Snapshot locked
          </p>
          <p style={{ color: "var(--solar-muted)", fontSize: 12 }}>Redirecting...</p>
          <div style={{ marginTop: 20, width: 200, height: 3, background: "var(--solar-sun)", borderRadius: 2, margin: "20px auto 0", animation: "grow 1.8s linear forwards" }} />
          <style>{`@keyframes grow { from{width:0} to{width:200px} }`}</style>
        </div>
      </div>
    );
  }

  // ── Styles ─────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    borderRadius: 14, border: "1px solid var(--solar-border)",
    background: "var(--solar-surface)", overflow: "hidden", marginBottom: 20,
  };
  const cardHead: React.CSSProperties = {
    padding: "10px 16px", background: "rgba(245,166,35,0.06)",
    borderBottom: "1px solid var(--solar-border)",
    fontSize: 9, fontWeight: 700, color: "var(--solar-muted)",
    letterSpacing: 1, textTransform: "uppercase",
  };
  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid var(--solar-border, #1e1e2e)",
    background: "var(--solar-bg, #0a0a0f)", color: "var(--solar-text, #f0f0f0)",
    fontSize: 13, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--solar-bg)", color: "var(--solar-text)", fontFamily: "system-ui, sans-serif" }}>

      {!wizardMode && (
        <nav style={{ borderBottom: "1px solid var(--solar-border)", background: "var(--solar-surface)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 14, fontWeight: 800, color: "var(--solar-sun)", textDecoration: "none" }}>
            ☀ Solar Tax Engine
          </Link>
          <span style={{ fontSize: 11, color: "var(--solar-muted)" }}>Form 8879 · e-file Signature Authorization</span>
        </nav>
      )}

      <div style={{ maxWidth: 660, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ── IRS Header ───────────────────────────────────────────── */}
        <div style={{
          border: "2px solid var(--solar-border)", borderRadius: 12,
          overflow: "hidden", marginBottom: 20,
        }}>
          {/* Top bar */}
          <div style={{
            background: "rgba(7,24,56,0.9)", padding: "12px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>Form 8879</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                IRS e-file Signature Authorization
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Department of the Treasury</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Internal Revenue Service</div>
              <div style={{ marginTop: 4, padding: "2px 10px", borderRadius: 4, background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", fontSize: 11, fontWeight: 700, color: "var(--solar-sun)" }}>
                Tax Year {taxYear.year}
              </div>
            </div>
          </div>

          {/* ERO Info */}
          <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--solar-border)", background: "rgba(7,24,56,0.3)", display: "flex", gap: 24, fontSize: 11 }}>
            <div><span style={{ color: "var(--solar-muted)" }}>ERO: </span><span style={{ fontWeight: 700, color: "var(--solar-text)" }}>TLNC TRADE LLC</span></div>
            <div><span style={{ color: "var(--solar-muted)" }}>EIN: </span><span style={{ color: "var(--solar-text)" }}>36-4986102</span></div>
            <div><span style={{ color: "var(--solar-muted)" }}>Location: </span><span style={{ color: "var(--solar-text)" }}>Houston, TX</span></div>
          </div>
        </div>

        {/* ── PART I — Tax Return Information ─────────────────────── */}
        <div style={card}>
          <div style={cardHead}>Part I — Tax Return Information (Whole Dollars Only)</div>
          <div style={{ padding: "0 0" }}>
            {[
              { line: "1", label: "Adjusted gross income",          value: agi,         note: "Line 11" },
              { line: "2", label: "Total tax",                      value: totalTax,    note: "Line 24", red: true },
              { line: "3", label: "Federal income tax withheld",    value: withholding, note: "Line 25d" },
              { line: "4", label: isRefund ? "Refund" : "—",        value: isRefund ? refund : 0,     note: "Line 34", green: isRefund },
              { line: "5", label: "Amount you owe",                 value: !isRefund ? amountDue : 0, note: "Line 37", red: !isRefund },
            ].map((row, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center",
                padding: "10px 20px",
                borderBottom: i < 4 ? "1px solid var(--solar-border)" : "none",
              }}>
                <div style={{ width: 28, fontSize: 12, fontWeight: 800, color: "var(--solar-sun)" }}>{row.line}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: "var(--solar-text)" }}>{row.label}</span>
                  <span style={{ fontSize: 10, color: "var(--solar-muted)", marginLeft: 8 }}>{row.note}</span>
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 800, fontFamily: "monospace",
                  color: (row as any).red ? "var(--solar-red)" : (row as any).green ? "var(--solar-green)" : "var(--solar-text)",
                  minWidth: 100, textAlign: "right",
                }}>
                  ${fmt(row.value)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 20px", background: "rgba(0,0,0,0.2)", fontSize: 10, color: "var(--solar-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            🔒 Read-only · Calculated by Solar Tax Engine from BALANCED scenario
          </div>
        </div>

        {/* ── Taxpayer Info ────────────────────────────────────────── */}
        <div style={card}>
          <div style={cardHead}>Taxpayer Information</div>
          <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={inp} />
            <input placeholder="Last Name"  value={lastName}  onChange={e => setLastName(e.target.value)}  style={inp} />
            <input placeholder="SSN (XXX-XX-XXXX)" value={ssn} onChange={e => setSsn(e.target.value)} style={{ ...inp, gridColumn: "1 / -1" }} />
          </div>
          {isMFJ && (
            <div style={{ padding: "0 20px 14px", borderTop: "1px solid var(--solar-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--solar-muted)", padding: "10px 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Spouse</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input placeholder="First Name" value={spouseFirstName} onChange={e => setSpouseFirstName(e.target.value)} style={inp} />
                <input placeholder="Last Name"  value={spouseLastName}  onChange={e => setSpouseLastName(e.target.value)}  style={inp} />
                <input placeholder="SSN (XXX-XX-XXXX)" value={spouseSsn} onChange={e => setSpouseSsn(e.target.value)} style={{ ...inp, gridColumn: "1 / -1" }} />
              </div>
            </div>
          )}
        </div>

        {/* ── PART II — Declaration and Signature ─────────────────── */}
        <div style={card}>
          <div style={cardHead}>Part II — Declaration and Signature Authorization</div>
          <div style={{ padding: "14px 20px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginBottom: 16 }}>
              <input
                type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: "var(--solar-sun)", flexShrink: 0 }}
              />
              <p style={{ fontSize: 12, color: "var(--solar-muted)", lineHeight: 1.7, margin: 0 }}>
                I authorize <strong style={{ color: "var(--solar-text)" }}>TLNC TRADE LLC</strong> to enter or generate my PIN as my signature on my {taxYear.year} electronically filed income tax return. Under penalties of perjury, I declare that I have examined this return and to the best of my knowledge it is true, correct, and complete.
              </p>
            </label>
          </div>
        </div>

        {/* ── PIN Entry ────────────────────────────────────────────── */}
        <div style={card}>
          <div style={cardHead}>Self-Select PIN — Electronic Signature</div>
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 11, color: "var(--solar-muted)", marginBottom: 16, lineHeight: 1.6 }}>
              Choose any 5-digit number (not all zeros). This PIN is your legal electronic signature on Form 8879.
            </p>
            <PinSection
              label={primary ? `${primary.firstName} ${primary.lastName} — Primary Taxpayer` : "Primary Taxpayer"}
              pin={primaryPin} onPin={setPrimaryPin}
              confirm={confirmPin} onConfirm={setConfirmPin}
              valid={primaryOk}
            />
            {isMFJ && (
              <PinSection
                label={spouse ? `${spouse.firstName} ${spouse.lastName} — Spouse` : "Spouse"}
                pin={spousePin} onPin={setSpousePin}
                confirm={confirmSP} onConfirm={setConfirmSP}
                valid={spouseOk}
                style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--solar-border)" }}
              />
            )}
          </div>
          {/* Date + Filing info */}
          <div style={{ padding: "10px 20px", borderTop: "1px solid var(--solar-border)", display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ color: "var(--solar-muted)" }}>Date: <strong style={{ color: "var(--solar-text)" }}>{today}</strong></span>
            <span style={{ color: "var(--solar-muted)" }}>Filing: <strong style={{ color: "var(--solar-text)" }}>{taxYear.filingStatus?.replace(/_/g, " ")}</strong></span>
          </div>
        </div>

        {/* ── Errors + validation hints ────────────────────────────── */}
        {error && (
          <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--solar-red)", fontSize: 12 }}>
            ⚠ {error}
          </div>
        )}
        {!valid && (
          <div style={{ marginBottom: 16, fontSize: 11, color: "var(--solar-muted)" }}>
            {!primaryOk   && <div>· Enter matching 5-digit PIN for primary taxpayer</div>}
            {isMFJ && !spouseOk && <div>· Enter matching 5-digit PIN for spouse (required for MFJ)</div>}
            {!agree       && <div>· Authorize electronic filing to continue</div>}
          </div>
        )}

        {/* ── Action buttons ───────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handlePdf}
            disabled={pdfLoading}
            style={{
              flex: 1, padding: "14px", borderRadius: 12, border: "1px solid var(--solar-border)",
              background: "var(--solar-surface)", color: "var(--solar-text)",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            {pdfLoading ? "⏳ Generating..." : "📄 Download Form 8879 PDF"}
          </button>
          <button
            onClick={handleSign}
            disabled={!valid || loading}
            style={{
              flex: 2, padding: "14px", borderRadius: 12, border: "none",
              background: valid
                ? "linear-gradient(135deg, var(--solar-sun), var(--solar-sun-deep))"
                : "var(--solar-border)",
              color: valid ? "#000" : "var(--solar-muted)",
              fontSize: 15, fontWeight: 800,
              cursor: valid ? "pointer" : "not-allowed",
              boxShadow: valid ? "0 6px 24px rgba(232,85,0,0.22)" : "none",
            }}
          >
            {loading ? "⏳ Signing..." : "🔐 Sign & File →"}
          </button>
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link href={`/tax-year/${taxYear.id}/fast-file`} style={{ fontSize: 12, color: "var(--solar-muted)", textDecoration: "none" }}>
            ← Back to Fast Filing
          </Link>
        </div>

        <div style={{ marginTop: 24, padding: "12px 16px", borderRadius: 10, background: "var(--solar-surface)", border: "1px solid var(--solar-border)", fontSize: 10, color: "var(--solar-muted)", lineHeight: 1.7 }}>
          Form 8879 (IRS e-file Signature Authorization). Your PIN is stored as a one-way hash and cannot be recovered. SolarTax is not affiliated with the IRS. For planning purposes only — consult a licensed CPA.
        </div>
      </div>
    </div>
  );
}

// ── PinSection sub-component ───────────────────────────────────────────────
function PinSection({ label, pin, onPin, confirm, onConfirm, valid, style: extraStyle }: any) {
  const pinOk     = pin.length === 5 && /^\d{5}$/.test(pin);
  const confirmOk = pin === confirm && confirm.length === 5;

  const pinInp = (val: string, onChange: any, ok: boolean, mismatch: boolean): React.CSSProperties => ({
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${ok ? "var(--solar-green)" : mismatch ? "var(--solar-red)" : "var(--solar-border)"}`,
    background: "var(--solar-bg)", color: "var(--solar-text)",
    fontSize: 18, letterSpacing: 6, textAlign: "center",
    outline: "none", transition: "border-color .2s", boxSizing: "border-box",
  });

  return (
    <div style={extraStyle}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--solar-text)", marginBottom: 10 }}>{label}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 9, color: "var(--solar-muted)", display: "block", marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>PIN</label>
          <input
            type="password" inputMode="numeric" maxLength={5}
            value={pin} onChange={e => onPin(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="• • • • •"
            style={pinInp(pin, onPin, pinOk, false)}
          />
        </div>
        <div>
          <label style={{ fontSize: 9, color: "var(--solar-muted)", display: "block", marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>Confirm PIN</label>
          <input
            type="password" inputMode="numeric" maxLength={5}
            value={confirm} onChange={e => onConfirm(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="• • • • •"
            style={pinInp(confirm, onConfirm, confirmOk, confirm.length > 0 && confirm !== pin)}
          />
        </div>
      </div>
      {confirm.length > 0 && confirm !== pin && (
        <p style={{ fontSize: 10, color: "var(--solar-red)", marginTop: 4 }}>PINs do not match</p>
      )}
      {valid && <p style={{ fontSize: 10, color: "var(--solar-green)", marginTop: 4 }}>✓ PIN confirmed</p>}
    </div>
  );
}
