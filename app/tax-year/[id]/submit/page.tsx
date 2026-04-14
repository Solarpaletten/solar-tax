// app/tax-year/[id]/submit/page.tsx
export const dynamic = "force-dynamic";

import { getTaxYearFull } from "@/actions/tax-year";
import { notFound } from "next/navigation";
import { SubmitScreen } from "@/components/submit/SubmitScreen";

export default async function SubmitPage({ params }: { params: { id: string } }) {
  const taxYear = await getTaxYearFull(params.id);
  if (!taxYear) return notFound();
  return <SubmitScreen taxYear={taxYear} />;
}
