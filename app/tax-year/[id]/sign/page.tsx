// app/tax-year/[id]/sign/page.tsx
export const dynamic = "force-dynamic";

import { getTaxYearFull } from "@/actions/tax-year";
import { prisma, ensureSchema } from "@/lib/db/client";
import { notFound, redirect } from "next/navigation";
import { Sign8879Screen } from "@/components/submit/Sign8879Screen";

export default async function SignPage({ params }: { params: { id: string } }) {
  await ensureSchema();

  const taxYear = await getTaxYearFull(params.id);
  if (!taxYear) return notFound();

  // Already signed → go to submit
  if ((taxYear as any).signed8879) {
    redirect(`/tax-year/${params.id}/submit`);
  }

  // Get taxpayers for this household
  const taxpayers = await prisma.taxpayer.findMany({
    where: { householdId: taxYear.householdId },
    orderBy: { isPrimary: "desc" },
  });

  return <Sign8879Screen taxYear={taxYear} taxpayers={taxpayers} />;
}
