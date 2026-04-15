// app/api/pdf/[taxYearId]/route.ts — Fixed for Float DB s
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { generateTaxSummaryPDF } from "@/lib/pdf/summary";
import type { PDFSummaryInput, PDFScenarioData } from "@/lib/pdf/summary";

export async function GET(_req: NextRequest, { params }: { params: { taxYearId: string } }) {
  const taxYear = await prisma.taxYear.findUnique({
    where:   { id: params.taxYearId },
    include: {
      household: true,
      scenarios: { include: { result: true }, orderBy: { type: "asc" } },
    },
  });

  if (!taxYear) return NextResponse.json({ error: "Tax year not found" }, { status: 404 });

  const ORDER = ["CONSERVATIVE", "BALANCED", "AGGRESSIVE"];
  const scenarios = taxYear.scenarios
    .filter((s: any) => s.result)
    .sort((a: any, b: any) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type))
    .map((s: any): PDFScenarioData => {
      const r         = s.result!;
      const refundNum = Number(r.refund);
      return {
        scenarioName:      s.name,
        grossIncome:       r.grossIncome,
        allowedExpenses:   r.allowedExpenses,
        netProfit:         r.netProfit,
        seTax:             r.seTax,
        deductibleSEhalf:  r.deductibleSEhalf,
        agi:               r.agi,
        standardDeduction: r.standardDeduction,
        taxableIncome:     r.taxableIncome,
        totalCredits:      r.totalCredits,
        incomeTax:         r.taxOwed,
        totalTax:          r.taxOwed,
        refundAmount:      refundNum >= 0 ? refundNum : 0,
        amountDue:         refundNum <  0 ? Math.abs(refundNum) : 0,
        effectiveRate:     r.effectiveRate,
      };
    });

  if (scenarios.length === 0) {
    return NextResponse.json({ error: "No scenario results found. Run scenarios first." }, { status: 400 });
  }

  const input: PDFSummaryInput = {
    householdName: taxYear.household.name,
    taxYear:       taxYear.year,
    filingStatus:  taxYear.filingStatus,
    scenarios,
  };

  const pdf = await generateTaxSummaryPDF(input);
  const filename = `SolarTax_${taxYear.year}_${taxYear.household.name.replace(/\s+/g, "_")}.pdf`;

  return new Response(pdf, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
