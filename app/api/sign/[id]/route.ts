// app/api/sign/[id]/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma, ensureSchema } from "@/lib/db/client";
import { createHash } from "crypto";

function hashPin(pin: string): string {
  return createHash("sha256").update(pin + "solar-salt-2025").digest("hex");
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchema();
    const body = await req.json();
    const { primaryPin, spousePin } = body;

    // Validate primary PIN
    if (!primaryPin || primaryPin.length !== 5 || !/^\d{5}$/.test(primaryPin)) {
      return NextResponse.json({ error: "Primary PIN must be exactly 5 digits" }, { status: 400 });
    }

    const taxYear = await prisma.taxYear.findUnique({
      where: { id: params.id },
      select: { id: true, filingStatus: true },
    });
    if (!taxYear) {
      return NextResponse.json({ error: "Tax year not found" }, { status: 404 });
    }

    const isMFJ = taxYear.filingStatus === "MARRIED_FILING_JOINTLY";
    const now   = new Date();

    // Validate spouse PIN if MFJ
    if (isMFJ && spousePin) {
      if (spousePin.length !== 5 || !/^\d{5}$/.test(spousePin)) {
        return NextResponse.json({ error: "Spouse PIN must be exactly 5 digits" }, { status: 400 });
      }
    }

    await prisma.taxYear.update({
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

    return NextResponse.json({
      ok:              true,
      signedAt:        now.toISOString(),
      primarySigned:   true,
      spouseSigned:    isMFJ && !!spousePin,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  const ty = await prisma.taxYear.findUnique({
    where:  { id: params.id },
    select: {
      signed8879:          true,
      signedAt:            true,
      signed8879PrimaryAt: true,
      signed8879SpouseAt:  true,
    },
  });
  return NextResponse.json(ty ?? { signed8879: false });
}
