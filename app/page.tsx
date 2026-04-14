// app/page.tsx — Solar Landing v3
// Primary CTA: Fast Filing (1 click)
import Link from "next/link";
import { loadDemo } from "@/actions/demo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--solar-bg)", color: "var(--solar-text)", fontFamily: "system-ui, sans-serif" }}>

      {/* NAV */}
      <nav style={{
        borderBottom: "1px solid var(--solar-border)",
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: 1000, margin: "0 auto",
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--solar-sun)", letterSpacing: -.3 }}>
          ☀ Solar Tax Engine
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: "var(--solar-muted)", textDecoration: "none" }}>
            Dashboard
          </Link>
          <ThemeToggle />
          <form action={loadDemo}>
            <button type="submit" style={{
              padding: "8px 18px", borderRadius: 8, border: "none",
              background: "var(--solar-accent)", color: "#fff",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              Try demo →
            </button>
          </form>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 56px", textAlign: "center" }}>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          borderRadius: 20, border: "1px solid var(--solar-border)",
          background: "rgba(245,158,11,0.06)",
          padding: "6px 16px", fontSize: 11, color: "var(--solar-sun)",
          fontWeight: 600, letterSpacing: .5, marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--solar-sun)", animation: "pulse 2s ease-in-out infinite", display: "inline-block" }} />
          IRS 1040 · Tax Year 2025 · Pre-deadline optimization
        </div>

        <h1 style={{
          fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 800,
          lineHeight: 1.05, letterSpacing: -2, marginBottom: 20,
          color: "var(--solar-text)",
        }}>
          Optimize your taxes<br />
          <span style={{ color: "var(--solar-sun)" }}>before you file.</span>
        </h1>

        <p style={{ fontSize: 16, color: "var(--solar-muted)", lineHeight: 1.8, marginBottom: 40, maxWidth: 520, margin: "0 auto 40px" }}>
          See what to change before December 31 — and how it affects your refund, audit risk, and profit.
        </p>

        {/* PRIMARY CTAs */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>

          {/* ★ MAIN: Fast Filing */}
          <Link href="/fast-file" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "18px 40px", borderRadius: 14, border: "none",
            background: `linear-gradient(135deg, var(--solar-sun), var(--solar-sun-deep))`,
            color: "#000", fontSize: 16, fontWeight: 800,
            textDecoration: "none", letterSpacing: -.2,
            boxShadow: "0 8px 32px rgba(245,158,11,0.30)",
            transition: "all .2s",
          }}>
            ☀ Start Fast Filing
          </Link>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <form action={loadDemo}>
              <button type="submit" style={{
                padding: "12px 24px", borderRadius: 10,
                border: "1px solid var(--solar-border)",
                background: "var(--solar-surface)",
                color: "var(--solar-text)", fontSize: 13, fontWeight: 600,
                cursor: "pointer",
              }}>
                Try demo in 1 click →
              </button>
            </form>
            <Link href="/dashboard" style={{
              padding: "12px 24px", borderRadius: 10,
              border: "1px solid var(--solar-border)",
              background: "transparent",
              color: "var(--solar-muted)", fontSize: 13,
              textDecoration: "none",
            }}>
              Use my data →
            </Link>
          </div>

          <p style={{ fontSize: 11, color: "var(--solar-muted)", marginTop: 4 }}>
            No signup · Takes 30 seconds · Real IRS 2025 brackets
          </p>
        </div>
      </section>

      {/* VALUE CARDS */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { icon: "⚡", title: "3 scenarios instantly", sub: "Conservative · Balanced · Aggressive side by side" },
            { icon: "🛡", title: "Audit risk before filing", sub: "Rule-based flags, not guesswork" },
            { icon: "✓", title: "Clear actions — not just numbers", sub: "What to do now, before Dec 31" },
          ].map((c) => (
            <div key={c.title} style={{
              borderRadius: 14, border: "1px solid var(--solar-border)",
              background: "var(--solar-surface)", padding: "24px 20px",
              transition: "border-color .2s",
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--solar-text)", marginBottom: 6 }}>{c.title}</p>
              <p style={{ fontSize: 11, color: "var(--solar-muted)", lineHeight: 1.6 }}>{c.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO BLOCK */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{
          borderRadius: 18, border: "1px solid var(--solar-border)",
          background: "var(--solar-surface)",
          padding: "40px 48px", textAlign: "center",
          boxShadow: "0 4px 40px rgba(245,158,11,0.06)",
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--solar-sun)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>
            Live Demo
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, color: "var(--solar-text)", marginBottom: 8, lineHeight: 1.3 }}>
            See how a real family saves{" "}
            <span style={{ color: "var(--solar-green)" }}>$2,219</span>{" "}
            in 30 seconds.
          </p>
          <p style={{ fontSize: 13, color: "var(--solar-muted)", marginBottom: 28 }}>
            Pre-loaded household. No data entry. Just the outcome.
          </p>
          <form action={loadDemo}>
            <button type="submit" style={{
              padding: "14px 36px", borderRadius: 10, border: "none",
              background: "var(--solar-accent)", color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              Run demo →
            </button>
          </form>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 64px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--solar-text)", marginBottom: 24, textAlign: "center" }}>How it works</h2>
        <div style={{ borderRadius: 14, border: "1px solid var(--solar-border)", overflow: "hidden" }}>
          {[
            { n: "1", title: "Enter income and expenses", desc: "1099-NEC, W-2, business expenses. Takes 5 minutes." },
            { n: "2", title: "Compare 3 scenarios simultaneously", desc: "Profit, SE tax, taxable income, credits, refund — in real-time." },
            { n: "3", title: "See what to change before year-end", desc: "What to adjust, why it matters, and what it saves." },
          ].map((step, i) => (
            <div key={step.n} style={{
              display: "flex", alignItems: "flex-start", gap: 20,
              padding: "20px 24px",
              borderTop: i > 0 ? "1px solid var(--solar-border)" : "none",
              background: "var(--solar-surface)",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                border: "1px solid var(--solar-sun)",
                background: "rgba(245,158,11,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--solar-sun)" }}>{step.n}</span>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--solar-text)", marginBottom: 4 }}>{step.title}</p>
                <p style={{ fontSize: 11, color: "var(--solar-muted)", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid var(--solar-border)",
        padding: "20px 24px",
        maxWidth: 1000, margin: "0 auto",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 11, color: "var(--solar-muted)" }}>☀ Solar Tax Engine · Project 43</span>
        <span style={{ fontSize: 11, color: "var(--solar-muted)" }}>For planning purposes only. Not tax advice.</span>
      </footer>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}
