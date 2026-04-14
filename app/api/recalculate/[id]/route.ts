// app/api/recalculate/[id]/route.ts
export const dynamic = "force-dynamic";

import { runAllScenarios } from "@/actions/scenario";
import { prisma, ensureSchema } from "@/lib/db/client";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchema();
    await runAllScenarios(params.id);

    // Fetch fresh results for the client
    const taxYear = await prisma.taxYear.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        scenarios: {
          include: { result: true },
          orderBy: { type: "asc" },
        },
        incomeItems:  true,
        expenseItems: true,
        dependents:   true,
      },
    });

    const best = taxYear.scenarios.find(s => s.type === "BALANCED")?.result
              ?? taxYear.scenarios[0]?.result;

    const totalIncome   = taxYear.incomeItems.reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalExpenses = taxYear.expenseItems.reduce((s, e) => s + parseFloat(e.amount), 0);

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      totalTax:         parseFloat(best?.taxOwed        ?? "0"),
      totalWithholding: parseFloat(best?.totalWithholding ?? "0"),
      amountDue:        parseFloat(best?.amountDue       ?? "0"),
      refund:           parseFloat(best?.refund          ?? "0"),
      effectiveRate:    parseFloat(best?.effectiveRate    ?? "0"),
      scenarios:        taxYear.scenarios,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
