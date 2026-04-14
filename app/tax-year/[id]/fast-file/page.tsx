// app/tax-year/[id]/fast-file/page.tsx
export const dynamic = "force-dynamic";

import { getTaxYearFull } from "@/actions/tax-year";
import { notFound } from "next/navigation";
import { FastFilingPage } from "@/components/fast-file/FastFilingPage";

export default async function FastFilePage({ params }: { params: { id: string } }) {
  const taxYear = await getTaxYearFull(params.id);
  if (!taxYear) return notFound();
  return <FastFilingPage taxYear={taxYear} />;
}