"use client";
// components/submit/Sign8879Screen.tsx
// Form 8879 — IRS e-file Signature Authorization
// Step 1 before Submit Screen

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TaxYear  = any;
type Taxpayer = any;

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function Sign8879Screen({
  taxYear,
  taxpayers,
}: {
  taxYear:    TaxYear;
  taxpayers:  Taxpayer[];
}) {
  const router = useRouter();

  const [primaryPin,  setPrimaryPin]  = useState("");
  const [confirmPin,  setConfirmPin]  = useState("");
  const [spousePin,   setSpousePin]   = useState("");
  const [confirmSP,   setConfirmSP]   = useState("");
  const [agree,       setAgree]       = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [step,        setStep]        = useState<"form" | "success">("form");

  const isMFJ     = taxYear.filingStatus === "MARRIED_FILING_JOINTLY";
  const primary   = taxpayers.find((t: any) => t.isPrimary)   ?? taxpayers[0];
  const spouse    = taxpayers.find((t: any) => !t.isPrimary)  ?? null;

  const scenarios    = taxYear.scenarios ?? [];
  const best         = scenarios.find((s: any) => s.type === "BALANCED")?.result ?? scenarios[0]?.result;
  const agi          = parseFloat(best?.agi              ?? "0");
  const totalTax     = parseFloat(best?.taxOwed          ?? "0");
  const withholding  = parseFloat(best?.totalWithholding ?? "0");
  const refund       = parseFloat(best?.refund           ?? "0");
  const amountDue    = parseFloat(best?.amountDue        ?? "0");
  const isRefund     = refund > 0;

  const primaryOk = primaryPin.length === 5 && /^\d{5}$/.test(primaryPin) && primaryPin === confirmPin;
  const spouseOk  = !isMFJ || !spouse || (spousePin.length === 5 && /^\d{5}$/.test(spousePin) && spousePin === confirmSP);
  const valid     = primaryOk && spouseOk && agree;

  const handleSign = async () => {
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const body: any = { primaryPin };
      if (isMFJ && spouse && spousePin) body.spousePin = spousePin;

      const res = await fetch(`/api/sign/${taxYear.id}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Signing failed");
      setStep("success");
      setTimeout(() => router.push(`/tax-year/${taxYear.id}/submit`), 1800);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  if (step === "success") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--solar-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--solar-text)", marginBottom: 8 }}>Authorization Complete</h1>
          <p style={{ color: "var(--solar-muted)", fontSize: 14, marginBottom: 4 }}>Form 8879 signed successfully</p>
          <p style={{ color: "var(--solar-muted)", fontSize: 12 }}>Redirecting to Submit Screen...</p>
          <div style={{ marginTop: 20, width: 48, height: 3, background: "var(--solar-sun)", borderRadius: 2, margin: "20px auto 0", animation: "grow 1.8s linear forwards" }} />
          <style>{`@keyframes grow { from{width:0} to{width:200px} }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--solar-bg)", color: "var(--solar-text)", fontFamily: "system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--solar-border)", background: "var(--solar-surface)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 800, color: "var(--solar-sun)", textDecoration: "none" }}>
          ☀ Solar Tax Engine
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--solar-muted)" }}>
          <span style={{ color: "var(--solar-muted)" }}>Step 1 of 2</span>
          <span style={{ color: "var(--solar-border)" }}>·</span>
          <span style={{ color: "var(--solar-sun)", fontWeight: 600 }}>Sign → Submit</span>
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 20, padding: "6px 14px", marginBottom: 16, fontSize: 11, color: "var(--solar-sun)", fontWeight: 600,
          }}>
            🔐 IRS Form 8879 — e-file Signature Authorization
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, marginBottom: 6, lineHeight: 1.2 }}>
            Authorize your {taxYear.year} tax return
          </h1>
          <p style={{ fontSize: 13, color: "var(--solar-muted)", lineHeight: 1.6 }}>
            Before filing with IRS, you must authorize electronic submission by entering a 5-digit PIN.
            This replaces your physical signature on Form 8879.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <SignBadge label={primary ? `${primary.firstName}` : "Primary"} done={primaryOk} />
          {isMFJ && spouse && (
            <>
              <div style={{ width: 20, height: 1, background: "var(--solar-border)" }} />
              <SignBadge label={spouse.firstName} done={spouseOk} />
            </>
          )}
          <div style={{ width: 20, height: 1, background: "var(--solar-border)" }} />
          <SignBadge label="Consent" done={agree} />
          <div style={{ width: 20, height: 1, background: "var(--solar-border)" }} />
          <SignBadge label="Submit" done={valid} active />
        </div>
        <div style={{
          borderRadius: 14, border: "1px solid var(--solar-border)",
          background: "var(--solar-surface)", overflow: "hidden", marginBottom: 20,
        }}>
          <div style={{ height: 2, background: "linear-gradient(90deg, var(--solar-sun), var(--solar-sun-deep))" }} />
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "var(--solar-muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
              Tax Summary — Form 1040 · {taxYear.year}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
              <SRow label="AGI (Line 11)"           value={`$${fmt(agi)}`} />
              <SRow label="Total Tax (Line 24)"     value={`$${fmt(totalTax)}`}    color="var(--solar-red)" />
              <SRow label="Withholding (Line 33)"   value={`$${fmt(withholding)}`} />
              {isRefund
                ? <SRow label="Refund (Line 34)"    value={`$${fmt(refund)}`}    color="var(--solar-green)" large />
                : <SRow label="Amount Due (Ln 37)"  value={`$${fmt(amountDue)}`} color="var(--solar-red)"   large />}
            </div>
            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "var(--solar-bg)", border: "1px solid var(--solar-border)", fontSize: 11, color: "var(--solar-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>🔒</span> Read-only — calculated by Solar Tax Engine
            </div>
          </div>
        </div>

        {/* Taxpayer Identity */}
        <div style={{
          borderRadius: 14, border: "1px solid var(--solar-border)",
          background: "var(--solar-surface)", padding: "16px 20px", marginBottom: 20,
        }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--solar-muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
            Taxpayer Information
          </p>
          <TRow label="Primary Taxpayer" value={primary ? `${primary.firstName} ${primary.lastName}` : taxYear.household?.name ?? "—"} />
          {isMFJ && <TRow label="Spouse" value={spouse ? `${spouse.firstName} ${spouse.lastName}` : "—"} />}
          <TRow label="Filing Status" value={taxYear.filingStatus?.replace(/_/g, " ")} />
          <TRow label="Tax Year" value={String(taxYear.year)} highlight />
          <TRow label="Date" value={today} />
        </div>

        {/* PIN Entry */}
        <div style={{
          borderRadius: 14, border: "1px solid var(--solar-border)",
          background: "var(--solar-surface)", padding: "20px", marginBottom: 20,
        }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--solar-muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
            Electronic Signature (Self-Select PIN)
          </p>
          <p style={{ fontSize: 11, color: "var(--solar-muted)", marginBottom: 16, lineHeight: 1.6 }}>
            Choose any 5-digit number (not all zeros). This PIN serves as your electronic signature.
            Do not share it with anyone.
          </p>

          {/* Primary */}
          <PinSection
            label={primary ? `${primary.firstName} ${primary.lastName} — Primary` : "Primary Taxpayer"}
            pin={primaryPin}       onPin={setPrimaryPin}
            confirm={confirmPin}   onConfirm={setConfirmPin}
            valid={primaryOk}
          />

          {/* Spouse (MFJ only) */}
          {isMFJ && spouse && (
            <PinSection
              label={`${spouse.firstName} ${spouse.lastName} — Spouse`}
              pin={spousePin}     onPin={setSpousePin}
              confirm={confirmSP} onConfirm={setConfirmSP}
              valid={spouseOk}
              style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--solar-border)" }}
            />
          )}
        </div>

        {/* Consent */}
        <div style={{
          borderRadius: 14, border: `1px solid ${agree ? "rgba(16,185,129,0.3)" : "var(--solar-border)"}`,
          background: agree ? "rgba(16,185,129,0.04)" : "var(--solar-surface)",
          padding: "16px 20px", marginBottom: 24,
          transition: "all .2s",
        }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={agree}
              onChange={e => setAgree(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, accentColor: "var(--solar-sun)", flexShrink: 0 }}
            />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--solar-text)", marginBottom: 6 }}>
                I authorize electronic filing of this return
              </p>
              <p style={{ fontSize: 11, color: "var(--solar-muted)", lineHeight: 1.7 }}>
                Under penalties of perjury, I declare that I have examined this return and to the best of my
                knowledge it is true, correct, and complete. I authorize Solar Tax to electronically submit
                this return to the IRS. I understand that my PIN is my legal signature.
              </p>
            </div>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 16, padding: "12px 16px", borderRadius: 10,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            color: "var(--solar-red)", fontSize: 12,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Validation hints */}
        {!valid && (
          <div style={{ marginBottom: 16, fontSize: 11, color: "var(--solar-muted)" }}>
            {!primaryOk && <div>· Enter matching 5-digit PIN for primary taxpayer</div>}
            {isMFJ && !spouseOk && <div>· Enter matching 5-digit PIN for spouse</div>}
            {!agree && <div>· Check the authorization box to continue</div>}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleSign}
          disabled={!valid || loading}
          onMouseEnter={e => { if (valid && !loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(232,85,0,0.32)"; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = valid ? "0 6px 24px rgba(232,85,0,0.22)" : "none"; }}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 12,
            border: "none",
            background: valid
              ? "linear-gradient(135deg, var(--solar-sun), var(--solar-sun-deep))"
              : "var(--solar-border)",
            color: valid ? "#000" : "var(--solar-muted)",
            fontSize: 15,
            fontWeight: 800,
            cursor: valid ? "pointer" : "not-allowed",
            transition: "all .2s",
            boxShadow: valid ? "0 6px 24px rgba(232,85,0,0.22)" : "none",
          }}
        >
          {loading ? "⏳ Signing..." : "🔐 Sign & Continue →"}
        </button>

        <Link
          href={`/tax-year/${taxYear.id}/fast-file`}
          style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: 12, color: "var(--solar-muted)", textDecoration: "none" }}
        >
          ← Back to Fast Filing
        </Link>

        {/* Legal note */}
        <div style={{
          marginTop: 24, padding: "12px 16px", borderRadius: 10,
          background: "var(--solar-surface)", border: "1px solid var(--solar-border)",
          fontSize: 10, color: "var(--solar-muted)", lineHeight: 1.7,
        }}>
          Form 8879 (IRS e-file Signature Authorization) is required for all electronically filed returns.
          Your PIN is stored securely and is used only to authorize this specific tax return.
          SolarTax is not affiliated with the IRS.
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SignBadge({ label, done, active }: { label: string; done: boolean; active?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      border: `1px solid ${done ? "rgba(16,185,129,0.4)" : active ? "var(--solar-border)" : "var(--solar-border)"}`,
      background: done ? "rgba(16,185,129,0.08)" : "transparent",
      fontSize: 10, fontWeight: 600,
      color: done ? "var(--solar-green)" : "var(--solar-muted)",
      whiteSpace: "nowrap",
    }}>
      <span>{done ? "✓" : active ? "→" : "○"}</span>
      {label}
    </div>
  );
}
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--solar-border)" }}>
      <span style={{ fontSize: 11, color: "var(--solar-muted)" }}>{label}</span>
      <span style={{ fontSize: large ? 15 : 12, fontWeight: large ? 800 : 600, color: color ?? "var(--solar-text)" }}>{value}</span>
    </div>
  );
}

function TRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--solar-border)" }}>
      <span style={{ fontSize: 11, color: "var(--solar-muted)" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: highlight ? "var(--solar-sun)" : "var(--solar-text)" }}>{value}</span>
    </div>
  );
}

function PinSection({ label, pin, onPin, confirm, onConfirm, valid, style: extraStyle }: any) {
  const pinOk     = pin.length === 5 && /^\d{5}$/.test(pin);
  const confirmOk = pin === confirm && confirm.length === 5;

  return (
    <div style={extraStyle}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--solar-text)", marginBottom: 10 }}>{label}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 10, color: "var(--solar-muted)", display: "block", marginBottom: 4 }}>5-DIGIT PIN</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={5}
            value={pin}
            onChange={e => onPin(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="• • • • •"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: `1px solid ${pinOk ? "var(--solar-green)" : "var(--solar-border)"}`,
              background: "var(--solar-bg)", color: "var(--solar-text)",
              fontSize: 16, letterSpacing: 4, textAlign: "center",
              outline: "none", transition: "border-color .2s",
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 10, color: "var(--solar-muted)", display: "block", marginBottom: 4 }}>CONFIRM PIN</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={5}
            value={confirm}
            onChange={e => onConfirm(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="• • • • •"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: `1px solid ${confirmOk ? "var(--solar-green)" : confirm.length > 0 && confirm !== pin ? "var(--solar-red)" : "var(--solar-border)"}`,
              background: "var(--solar-bg)", color: "var(--solar-text)",
              fontSize: 16, letterSpacing: 4, textAlign: "center",
              outline: "none", transition: "border-color .2s",
            }}
          />
        </div>
      </div>
      {confirm.length > 0 && confirm !== pin && (
        <p style={{ fontSize: 10, color: "var(--solar-red)", marginTop: 4 }}>PINs do not match</p>
      )}
      {valid && (
        <p style={{ fontSize: 10, color: "var(--solar-green)", marginTop: 4 }}>✓ PIN confirmed</p>
      )}
    </div>
  );
}
