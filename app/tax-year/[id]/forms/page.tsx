// app/tax-year/[id]/forms/page.tsx
// Interactive IRS Forms viewer — all forms with live calculated values s
export const dynamic = "force-dynamic";

import { getTaxYearFull } from "@/actions/tax-year";
import { prisma } from "@/lib/db/client";
import { notFound } from "next/navigation";
import { TaxFormsViewer } from "@/components/forms/TaxFormsViewer";

export default async function FormsPage({ params }: { params: { id: string } }) {
  const taxYear = await getTaxYearFull(params.id);
  if (!taxYear) return notFound();

  const taxpayers = await prisma.taxpayer.findMany({
    where:   { householdId: taxYear.householdId },
    orderBy: { isPrimary: "desc" },
  });

  return <TaxFormsViewer taxYear={taxYear} taxpayers={taxpayers} />;
}
