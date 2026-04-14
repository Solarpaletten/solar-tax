// app/fast-file/page.tsx
// Auto-route: finds the most recent taxYear and redirects to its fast-file page
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma, ensureSchema } from "@/lib/db/client";
import Link from "next/link";

export default async function FastFileAutoRoute() {
  await ensureSchema();

  // Find the most recently active taxYear
  const latest = await prisma.taxYear.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true, year: true, household: { select: { name: true } } },
  });

  if (latest) {
    redirect(`/tax-year/${latest.id}/fast-file`);
  }

  // No tax years yet — show onboarding
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--solar-bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        textAlign: "center",
        padding: 48,
        maxWidth: 480,
      }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>☀️</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--solar-text)", marginBottom: 12 }}>
          No tax years yet
        </h1>
        <p style={{ fontSize: 14, color: "var(--solar-muted)", lineHeight: 1.7, marginBottom: 32 }}>
          Create your first tax year in the dashboard to get started with Fast Filing.
        </p>
        <Link href="/dashboard?create=1" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 28px",
          borderRadius: 12,
          background: "var(--solar-sun)",
          color: "#000",
          fontWeight: 700,
          fontSize: 14,
          textDecoration: "none",
        }}>
          ☀ Create Tax Year & Start Filing →
        </Link>
      </div>
    </div>
  );
}
