// app/api/sign/[id]/route.ts s`
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma, ensureSchema } from "@/lib/db/client";
import { createHash } from "crypto";
import { calculate } from "@/lib/tax/calc";

const db = prisma as any;

function hashPin(pin: string): string {
  return createHash("sha256").update(pin + "solar-salt-2025").digest("hex");
}

function buildSnapshotHash(taxYearId: string, lines: {
  line1a: number; line8: number; line9: number; line11: number;
  line24: number; line33: number; line34: number; line37: number;
  effectiveRate: number;
}, ts: string): string {
  const payload = [
    taxYearId,
    lines.line1a, lines.line8,  lines.line9,  lines.line11,
    lines.line24, lines.line33, lines.line34, lines.line37,
    lines.effectiveRate, ts,
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await ensureSchema();
    const { primaryPin, spousePin } = await req.json();

    if (!primaryPin || primaryPin.length !== 5 || !/^\d{5}$/.test(primaryPin)) {
      return NextResponse.json({ error: "Primary PIN must be exactly 5 digits" }, { status: 400 });
    }

    const taxYear = await db.taxYear.findUnique({
      where:   { id: params.id },
      include: { incomeItems: true, expenseItems: true, dependents: true, snapshot: true },
    });
    if (!taxYear) return NextResponse.json({ error: "Tax year not found" }, { status: 404 });

    const isMFJ = taxYear.filingStatus === "MARRIED_FILING_JOINTLY";
    if (isMFJ && (!spousePin || spousePin.length !== 5 || !/^\d{5}$/.test(spousePin))) {
      return NextResponse.json({ error: "Spouse PIN required for MFJ" }, { status: 400 });
    }

    // Calculate 1040 lines from Float DB values
    const w2Items  = taxYear.incomeItems.filter((i: any) => i.type === "W2");
    const seItems  = taxYear.incomeItems.filter((i: any) =>
      ["SELF_EMPLOYMENT", "1099_NEC", "1099K", "1099_MISC", "FORM_1099_NEC"].includes(i.type)
    );

    const w2Income    = w2Items.reduce((s: number, i: any)  => s + Number(i.amount),      0);
    const w2Wh        = w2Items.reduce((s: number, i: any)  => s + Number(i.withholding), 0);
    const n99Wh       = seItems.reduce((s: number, i: any)  => s + Number(i.withholding), 0);
    const seGross     = seItems.reduce((s: number, i: any)  => s + Number(i.amount),      0);
    const allowedEx   = taxYear.expenseItems.reduce(
      (s: number, e: any) => s + Number(e.amount) * (e.businessPct / 100), 0
    );
    const seNetProfit = Math.max(0, seGross - allowedEx);

    const currentYear = new Date().getFullYear();
    const numChildren = taxYear.dependents.filter((d: any) => {
      const age = currentYear - new Date(d.dateOfBirth).getFullYear();
      return age < 17 && d.months >= 6;
    }).length;

    const calc = calculate({
      filingStatus: taxYear.filingStatus,
      w2Income, seNetProfit,
      w2Withholding: w2Wh, n99Withholding: n99Wh,
      estimatedPayments: 0, numChildren,
    });

    const now   = new Date();
    const lines = {
      line1a: calc.line1a, line8:  calc.line8,
      line9:  calc.line9,  line11: calc.line11,
      line24: calc.line24, line33: calc.line33,
      line34: calc.line34, line37: calc.line37,
      effectiveRate: calc.effectiveRate,
    };
    const hash = buildSnapshotHash(params.id, lines, now.toISOString());

    await db.$transaction(async (tx: any) => {
      await tx.taxYear.update({
        where: { id: params.id },
        data: {
          signed8879:          true,
          signedAt:            now,
          primaryPinHash:      hashPin(primaryPin),
          signed8879PrimaryAt: now,
          ...(isMFJ && spousePin ? {
            spousePinHash:      hashPin(spousePin),
            signed8879SpouseAt: now,
          } : {}),
        },
      });
      if (!taxYear.snapshot) {
        await tx.taxReturnSnapshot.create({
          data: { taxYearId: params.id, ...lines, hash, lockedAt: now },
        });
      }
    });

    return NextResponse.json({
      ok: true, signedAt: now.toISOString(),
      primarySigned: true, spouseSigned: isMFJ && !!spousePin,
      snapshotHash: hash.substring(0, 12), lines,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await ensureSchema();
  const ty = await db.taxYear.findUnique({
    where:  { id: params.id },
    select: {
      signed8879: true, signedAt: true,
      signed8879PrimaryAt: true, signed8879SpouseAt: true,
      snapshot: { select: { hash: true, lockedAt: true, line37: true, line34: true } },
    },
  });
  return NextResponse.json(ty ?? { signed8879: false });
}
