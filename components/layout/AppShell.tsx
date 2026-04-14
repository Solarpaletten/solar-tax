// components/layout/AppShell.tsx
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--solar-bg)", color: "var(--solar-text)" }}>
      <nav style={{
        borderBottom: "1px solid var(--solar-border)",
        background: "var(--solar-surface)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: "var(--solar-sun)", textDecoration: "none", letterSpacing: -.2 }}>
          ☀ Solar Tax Engine
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: "var(--solar-muted)", textDecoration: "none" }}>
            Dashboard
          </Link>
          <span style={{ fontSize: 11, color: "var(--solar-border)" }}>Project 43 · MVP</span>
          <ThemeToggle />
        </div>
      </nav>
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        {children}
      </main>
    </div>
  );
}
