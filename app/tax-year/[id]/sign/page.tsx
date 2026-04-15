// app/tax-year/[id]/sign/page.tsx — Updated with Form1040View source map s
export const dynamic = "force-dynamic";

import { getTaxYearFull } from "@/actions/tax-year";
import { prisma, ensureSchema } from "@/lib/db/client";
import { notFound, redirect } from "next/navigation";
import { Sign8879Screen } from "@/components/submit/Sign8879Screen";
import { Form1040View } from "@/components/irs/Form1040View";

export default async function SignPage({ params }: { params: { id: string } }) {
  await ensureSchema();

  const taxYear = await getTaxYearFull(params.id);
  if (!taxYear) return notFound();

  if ((taxYear as any).signed8879) {
    redirect(`/tax-year/${params.id}/submit`);
  }

  const taxpayers = await prisma.taxpayer.findMany({
    where: { householdId: taxYear.householdId },
    orderBy: { isPrimary: "desc" },
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, minHeight: "100vh", background: "#0a0a0f" }}>
      {/* Left — Form 1040 + 8879 source map */}
      <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", padding: "24px 20px", overflowY: "auto", maxHeight: "100vh" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#f5a623", marginBottom: 4 }}>
            📋 AUTO-CALCULATED FROM YOUR DATA
          </div>
          <div style={{ fontSize: 12, color: "#555" }}>
            Click any line to see which form and formula it comes from
          </div>
        </div>
        <Form1040View taxYear={taxYear} mode="both" />
      </div>

      {/* Right — Sign 8879 */}
      <div style={{ overflowY: "auto", maxHeight: "100vh" }}>
        <Sign8879Screen taxYear={taxYear} taxpayers={taxpayers} />
      </div>
    </div>
  );
}
