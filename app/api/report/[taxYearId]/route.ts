// app/api/report/[taxYearId]/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { generateIRSReport } from "@/actions/report";
import { generateReportPDF } from "@/lib/reporting/pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: { taxYearId: string } }
) {
  try {
    const report = await generateIRSReport(params.taxYearId);
    const bytes  = await generateReportPDF(report);
    const filename = `IRS1040_Report_${report.taxYear}_${report.taxpayerName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")}.pdf`;

    return new Response(bytes, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
