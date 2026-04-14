// app/tax-year/[id]/submit/page.tsx
export const dynamic = "force-dynamic";

import { getTaxYearFull } from "@/actions/tax-year";
import { notFound, redirect } from "next/navigation";
import { SubmitScreen } from "@/components/submit/SubmitScreen";

export default async function SubmitPage({ params }: { params: { id: string } }) {
  const taxYear = await getTaxYearFull(params.id);
  if (!taxYear) return notFound();

  // Must sign Form 8879 before submit
  if (!(taxYear as any).signed8879) {
    redirect(`/tax-year/${params.id}/sign`);
  }

  return <SubmitScreen taxYear={taxYear} />;
}
