// app/api/pdf/[taxYearId]/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { generateTaxSummaryPDF } from "@/lib/pdf/summary";
import type { PDFSummaryInput, PDFScenarioData } from "@/lib/pdf/summary";

export async function GET(
  _req: NextRequest,
  { params }: { params: { taxYearId: string } }
) {
  const taxYear = await prisma.taxYear.findUnique({
    where: { id: params.taxYearId },
    include: {
      household: true,
      scenarios: { include: { result: true }, orderBy: { type: "asc" } },
    },
  });

  if (!taxYear) {
    return NextResponse.json({ error: "Tax year not found" }, { status: 404 });
  }

  const SCENARIO_ORDER = ["CONSERVATIVE", "BALANCED", "AGGRESSIVE"];
  const scenarios = taxYear.scenarios
    .filter((s) => s.result)
    .sort((a, b) => SCENARIO_ORDER.indexOf(a.type) - SCENARIO_ORDER.indexOf(b.type))
    .map((s): PDFScenarioData => ({
      scenarioName:      s.name,
      grossIncome:       s.result!.grossIncome,
      allowedExpenses:   s.result!.allowedExpenses,
      netProfit:         s.result!.netProfit,
      seTax:             s.result!.seTax,
      deductibleSEhalf:  s.result!.deductibleSEhalf,
      agi:               s.result!.agi,
      standardDeduction: s.result!.standardDeduction,
      taxableIncome:     s.result!.taxableIncome,
      totalCredits:      s.result!.totalCredits,
      incomeTax:         s.result!.taxOwed,
      totalTax:          s.result!.taxOwed,
      refundAmount:      parseFloat(s.result!.refund) >= 0 ? s.result!.refund : "0",
      amountDue:         parseFloat(s.result!.refund) < 0
                           ? String(Math.abs(parseFloat(s.result!.refund)))
                           : "0",
      effectiveRate:     s.result!.effectiveRate,
    }));

  if (scenarios.length === 0) {
    return NextResponse.json(
      { error: "No scenario results found. Run scenarios first." },
      { status: 400 }
    );
  }

  const input: PDFSummaryInput = {
    householdName: taxYear.household.name,
    taxYear:       taxYear.year,
    filingStatus:  taxYear.filingStatus,
    generatedAt:   new Date().toISOString(),
    scenarios,
  };

  try {
    const pdfBytes = await generateTaxSummaryPDF(input);

    // Convert Uint8Array → Buffer (Node.js Buffer extends Uint8Array and
    // satisfies BodyInit — avoids the SharedArrayBuffer TS mismatch)
    const buffer = Buffer.from(pdfBytes);
    const filename = `solar-tax-${taxYear.year}-${taxYear.household.name.replace(/\s+/g, "-")}.pdf`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      String(buffer.length),
      },
    });
  } catch (err) {
    console.error("[PDF] Generation error:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
