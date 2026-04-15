"use client";
// components/wizard/WizardLayout.tsx — Phase 2
// Added: data prop → validation on Continue → redirect to error step s

import { useRouter } from "next/navigation";
import Link from "next/link";
import { STEPS } from "@/lib/wizard/steps";
import { nextStep, prevStep, isFirstStep, isLastStep, progressPct } from "@/lib/wizard/nav";
import { validateStep } from "@/lib/wizard/validate";

interface WizardLayoutProps {
  taxYearId: string;
  stepId: string;
  children: React.ReactNode;
  data?: Record<string, unknown>;      // taxYear data for validation
  onContinue?: () => void | Promise<void>;
  continueLabel?: string;
  continueDisabled?: boolean;
  loading?: boolean;
}

export function WizardLayout({
  taxYearId,
  stepId,
  children,
  data = {},
  onContinue,
  continueLabel = "Continue →",
  continueDisabled = false,
  loading = false,
}: WizardLayoutProps) {
  const router = useRouter();

  // ── Strict flow map — no skipping steps ─────────────────
  const flowMap: Record<string, string> = {
    sign:       "form1040",
    form1040:   "schedule1",
    schedule1:  "schedule2",
    schedule2:  "scheduleC",
    scheduleC:  "scheduleD",
    scheduleD:  "scheduleSE",
    scheduleSE: "form8949",
    form8949:   "form8995",
    form8995:   "form8829",
    form8829:   "review",
    review:     "review",
  };
  const nextStepId = flowMap[stepId];

  const step = STEPS.find((s) => s.id === stepId);
  const prev = prevStep(stepId);
  const pct  = progressPct(stepId);
  const currentIndex = STEPS.findIndex((s) => s.id === stepId);

  const handleContinue = async () => {
    // 1. Custom handler takes priority (e.g. sign form submit)
    if (onContinue) {
      await onContinue();
      return;
    }

    // 2. Validate current step — returns errorStep string or null
    const errorStep = validateStep(stepId, data);
    if (errorStep) {
      router.push(`/tax-year/${taxYearId}/wizard/${errorStep}`);
      return;
    }

    // 3. Advance to next step using strict flow map
    if (nextStepId && nextStepId !== stepId) {
      router.push(`/tax-year/${taxYearId}/wizard/${nextStepId}`);
    }
  };

  const handleBack = () => {
    if (prev) router.push(prev.path(taxYearId));
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--solar-bg, #0a0a0f)",
      color: "var(--solar-text, #f0f0f0)",
      fontFamily: "system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Top nav ─────────────────────────────────────── */}
      <nav style={{
        borderBottom: "1px solid var(--solar-border, #1e1e2e)",
        background: "var(--solar-surface, #111118)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <Link href={`/tax-year/${taxYearId}`}
          style={{ fontSize: 14, fontWeight: 800, color: "var(--solar-sun, #f5a623)", textDecoration: "none" }}>
          ☀️ Solar Tax
        </Link>
        <span style={{ fontSize: 13, color: "var(--solar-muted, #666)" }}>
          Step {currentIndex + 1} of {STEPS.length}
        </span>
        <Link href={`/tax-year/${taxYearId}`}
          style={{ fontSize: 12, color: "var(--solar-muted, #666)", textDecoration: "none" }}>
          ✕ Exit
        </Link>
      </nav>

      {/* ── Progress bar ─────────────────────────────────── */}
      <div style={{ height: 3, background: "var(--solar-border, #1e1e2e)" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "var(--solar-sun, #f5a623)",
          transition: "width 0.3s ease",
          borderRadius: "0 2px 2px 0",
        }} />
      </div>

      {/* ── Step pills ───────────────────────────────────── */}
      <div style={{
        overflowX: "auto",
        background: "var(--solar-surface, #111118)",
        borderBottom: "1px solid var(--solar-border, #1e1e2e)",
        padding: "10px 24px",
        display: "flex",
        gap: 6,
        scrollbarWidth: "none",
      }}>
        {STEPS.map((s, i) => {
          const isDone    = i < currentIndex;
          const isCurrent = s.id === stepId;
          return (
            <div key={s.id} style={{
              flexShrink: 0,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: isCurrent ? 700 : 400,
              background: isCurrent
                ? "var(--solar-sun, #f5a623)"
                : isDone ? "rgba(245,166,35,0.15)" : "var(--solar-bg, #0a0a0f)",
              color: isCurrent ? "#000" : isDone ? "var(--solar-sun, #f5a623)" : "var(--solar-muted, #666)",
              border: isDone ? "1px solid rgba(245,166,35,0.3)" : "1px solid transparent",
              whiteSpace: "nowrap",
              cursor: isDone ? "pointer" : "default",
            }}
              onClick={() => isDone && router.push(s.path(taxYearId))}
            >
              {isDone ? "✓ " : ""}{s.shortTitle}
            </div>
          );
        })}
      </div>

      {/* ── Step header ──────────────────────────────────── */}
      <div style={{ padding: "24px 24px 0", maxWidth: 760, margin: "0 auto", width: "100%" }}>
        {step?.irsForm && (
          <p style={{ fontSize: 11, color: "var(--solar-muted, #666)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
            IRS {step.irsForm}
          </p>
        )}
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{step?.title ?? stepId}</h1>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "24px", maxWidth: 760, margin: "0 auto", width: "100%" }}>
        {children}
      </main>

      {/* ── Sticky footer ────────────────────────────────── */}
      <footer style={{
        position: "sticky", bottom: 0,
        background: "var(--solar-surface, #111118)",
        borderTop: "1px solid var(--solar-border, #1e1e2e)",
        padding: "14px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        zIndex: 40,
      }}>
        {!isFirstStep(stepId) ? (
          <button onClick={handleBack} style={{
            padding: "10px 20px", borderRadius: 8,
            border: "1px solid var(--solar-border, #1e1e2e)",
            background: "transparent", color: "var(--solar-muted, #666)",
            fontSize: 14, cursor: "pointer",
          }}>← Back</button>
        ) : <div />}

        <span style={{ fontSize: 12, color: "var(--solar-muted, #666)" }}>{pct}% complete</span>

        <button onClick={handleContinue} disabled={continueDisabled || loading} style={{
          padding: "10px 24px", borderRadius: 8, border: "none",
          background: continueDisabled || loading ? "var(--solar-border, #1e1e2e)" : "var(--solar-sun, #f5a623)",
          color: continueDisabled || loading ? "var(--solar-muted, #666)" : "#000",
          fontSize: 14, fontWeight: 700,
          cursor: continueDisabled || loading ? "not-allowed" : "pointer",
          minWidth: 120, transition: "opacity 0.15s",
        }}>
          {loading ? "…" : stepId === "review" ? "Submit ✓" : continueLabel}
        </button>
      </footer>
    </div>
  );
}
