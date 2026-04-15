// app/tax-year/[id]/form1040/page.tsx
export const dynamic = "force-dynamic";

import { getTaxYearFull } from "@/actions/tax-year";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";
import { Form1040Input } from "@/components/workspace/Form1040Input";

export default async function Form1040Page({ params }: { params: { id: string } }) {
  const taxYear = await getTaxYearFull(params.id);
  if (!taxYear) return notFound();

  return (
    <AppShell>
      <WorkspaceTabs taxYearId={params.id} />
      <Form1040Input taxYear={taxYear} />
    </AppShell>
  );
}
