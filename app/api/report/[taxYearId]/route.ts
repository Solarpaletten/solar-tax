// app/api/report/[taxYearId]/route.ts 
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { generateIRSReport } from "@/actions/report";
import { generateFilingPacket } from "@/lib/reporting/pdf-engine";

export async function GET(
  _req: Request,
  { params }: { params: { taxYearId: string } }
) {
  try {
    const report = await generateIRSReport(params.taxYearId);
    const pdf    = await generateFilingPacket(report);

    const filename = `SolarTax_${report.taxYear}_${report.taxpayerName.replace(/\s+/g, "_")}_Filing_Packet.pdf`;

    return new Response(pdf, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
