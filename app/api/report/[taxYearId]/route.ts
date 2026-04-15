// app/api/report/[taxYearId]/route.ts s
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { generateIRSReport } from "@/actions/report";
import { generateFilingPacket } from "@/lib/reporting/pdf-engine";

const db = prisma as any;

export async function GET(req: Request, { params }: { params: { taxYearId: string } }) {
  try {
    const url      = new URL(req.url);
    const snapshot = await db.taxReturnSnapshot.findUnique({
      where: { taxYearId: params.taxYearId },
    });

    let report: any;

    if (snapshot) {
      const taxYear = await prisma.taxYear.findUnique({
        where:   { id: params.taxYearId },
        include: { household: true },
      });
      if (!taxYear) return NextResponse.json({ error: "Tax year not found" }, { status: 404 });

      const fmt    = (n: number) => String(Math.round(n));
      const stdDed = taxYear.filingStatus === "MARRIED_FILING_JOINTLY" ? 29200 : 14600;

      report = {
        taxYear:         taxYear.year,
        filingStatus:    taxYear.filingStatus,
        taxpayerName:    taxYear.household.name,
        line1a:  fmt(snapshot.line1a),
        line8:   fmt(snapshot.line8),
        line9:   fmt(snapshot.line9),
        line11:  fmt(snapshot.line11),
        line12:  fmt(stdDed),
        line15:  fmt(Math.max(0, snapshot.line11 - stdDed)),
        line16:  "0",
        line24:  fmt(snapshot.line24),
        line25d: fmt(snapshot.line33),
        line33:  fmt(snapshot.line33),
        line34:  fmt(snapshot.line34),
        line37:  fmt(snapshot.line37),
        effectiveRate:    snapshot.effectiveRate,
        snapshotHash:     snapshot.hash,
        snapshotLockedAt: snapshot.lockedAt,
        isSnapshot:       true,
      };
    } else {
      const ov: Record<string, number> = {};
      for (const key of ["line1a", "line8", "line25a", "line25b", "line26"]) {
        const val = url.searchParams.get(key);
        if (val) ov[key] = parseFloat(val);
      }
      report = await generateIRSReport(
        params.taxYearId,
        Object.keys(ov).length > 0 ? ov : undefined
      );
    }

    const pdf      = await generateFilingPacket(report);
    const yearNum  = report.taxYear ?? params.taxYearId;
    const name     = (report.taxpayerName ?? "Return").replace(/\s+/g, "_");
    const suffix   = snapshot ? "_SIGNED" : "_DRAFT";
    const filename = `SolarTax_${yearNum}_${name}${suffix}.pdf`;

    return new Response(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control":       "no-store",
        "X-Solar-Snapshot":    snapshot ? "true" : "false",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
