// app/tax-year/[id]/wizard/page.tsx
// Entry point — redirects to first wizard step.

import { redirect } from "next/navigation";
import { STEPS } from "@/lib/wizard/steps";

export default function WizardEntryPage({ params }: { params: { id: string } }) {
  redirect(STEPS[0].path(params.id));
}
