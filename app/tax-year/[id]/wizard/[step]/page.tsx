// app/tax-year/[id]/wizard/[step]/page.tsx — Phase 2 patch
// Consolidated step IDs: scheduleC, scheduleSE (no C1/C2/SE1/SE2) s

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getTaxYearFull } from "@/actions/tax-year";
import { STEP_IDS } from "@/lib/wizard/steps";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { Sign8879Screen }         from "@/components/submit/Sign8879Screen";
import { Form1040Input }          from "@/components/workspace/Form1040Input";
import { SubmitScreen }           from "@/components/submit/SubmitScreen";
import { WizardReviewScreen }     from "@/components/wizard/WizardReviewScreen";
import { ScheduleCForm }          from "@/components/wizard/forms/ScheduleCForm";
import { ScheduleCParallel }      from "@/components/wizard/forms/ScheduleCParallel";
import { ScheduleSEParallel }     from "@/components/wizard/forms/ScheduleSEParallel";

function Placeholder({ title, form, desc, flows }: {
  title: string; form: string; desc: string; flows?: string[];
}) {
  return (
    <div>
      <div style={{
        border: "1px dashed #2a2a3e", borderRadius: 12,
        padding: 32, textAlign: "center", marginTop: 16,
      }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>📄</p>
        <p style={{ fontWeight: 700, color: "#f0f0f0", marginBottom: 6 }}>{title}</p>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>IRS {form}</p>
        <p style={{ fontSize: 12, color: "#555", maxWidth: 420, margin: "0 auto" }}>{desc}</p>
        <div style={{
          marginTop: 18, padding: "6px 14px", background: "rgba(245,166,35,0.1)",
          borderRadius: 6, display: "inline-block", fontSize: 11, color: "#f5a623",
          border: "1px solid rgba(245,166,35,0.2)",
        }}>Phase 3 — UI coming next</div>
      </div>
      {flows && flows.length > 0 && (
        <div style={{ marginTop: 12, padding: 14, background: "#0d0d1a", borderRadius: 8, border: "1px solid #1a1a2e" }}>
          <p style={{ fontSize: 10, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Data flows to</p>
          {flows.map((f, i) => <p key={i} style={{ fontSize: 12, color: "#f5a623", margin: "3px 0" }}>→ {f}</p>)}
        </div>
      )}
    </div>
  );
}

interface PageProps {
  params: { id: string; step: string };
}

export default async function WizardStepPage({ params }: PageProps) {
  const { id, step } = params;
  if (!STEP_IDS.includes(step)) return notFound();

  const taxYear = await getTaxYearFull(id);
  if (!taxYear) return notFound();

  const validationData: Record<string, unknown> = {
    signed8879:  (taxYear as any).signed8879 ?? false,
    hasIncome:   taxYear.incomeItems.length > 0,
    hasExpenses: taxYear.expenseItems.length > 0,
  };

  let taxpayers: any[] = [];
  if (step === "sign") {
    const { prisma, ensureSchema } = await import("@/lib/db/client");
    await ensureSchema();
    taxpayers = await prisma.taxpayer.findMany({
      where: { householdId: taxYear.householdId },
      orderBy: { isPrimary: "desc" },
    });
  }

  function renderStep() {
    switch (step) {
      case "sign":
        return <Sign8879Screen taxYear={taxYear} taxpayers={taxpayers} wizardMode />;

      case "form1040":
        return <Form1040Input taxYear={taxYear} />;

      case "schedule1":
        return (
          <Placeholder
            title="Schedule 1 — Additional Income & Adjustments"
            form="Schedule 1 (Form 1040)"
            desc="Business income from both Schedule C forms ($13,011). SE tax deduction from Schedule SE ($920). Total adjustments → AGI."
            flows={["1040 Line 8 (Additional Income)", "1040 Line 10 → AGI"]}
          />
        );

      case "schedule2":
        return (
          <Placeholder
            title="Schedule 2 — Additional Taxes"
            form="Schedule 2 (Form 1040)"
            desc="Self-employment tax (social security + medicare). VASIL $1,219 + SVIATLIANA $619 = $1,838 total SE tax."
            flows={["1040 Line 23 (SE Tax)", "1040 Line 24 (Total Tax)"]}
          />
        );

      case "scheduleC":
        return (
          <ScheduleCParallel taxYearId={id} />
        );

      case "scheduleD":
        return (
          <Placeholder
            title="Schedule D — Capital Gains & Losses"
            form="Schedule D (Form 1040)"
            desc="Robinhood short-term transactions (Box A). Proceeds $1,629, cost basis $733, net gain $896."
            flows={["1040 Line 7 (Capital Gain)"]}
          />
        );

      case "scheduleSE": {
        const seItems2   = incomeItems.filter((i: any) => i.type !== "W2");
        const seGross2   = seItems2.reduce((s: number, i: any) => s + Number(i.amount), 0);
        const allowedEx2 = expenseItems.reduce(
          (s: number, e: any) => s + Number(e.amount) * (e.businessPct / 100), 0
        );
        const seNetProfit2 = Math.max(0, seGross2 - allowedEx2);
        return (
          <ScheduleSEParallel
            primaryNetProfit={seNetProfit2}
            spouseNetProfit={0}
          />
        );
      }

      case "review":
        return <WizardReviewScreen taxYear={taxYear} taxYearId={id} />;

      default:
        return notFound();
    }
  }

  return (
    <WizardLayout taxYearId={id} stepId={step} data={validationData}>
      {renderStep()}
    </WizardLayout>
  );
}
