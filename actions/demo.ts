// actions/demo.ts
"use server";

import { prisma, ensureSchema } from "@/lib/db/client";
import { runAllScenarios } from "./scenario";
import { refreshAuditFlags } from "./audit-flags";
import { redirect } from "next/navigation";

export async function loadDemo() {
  await ensureSchema();
  let household = await prisma.household.findFirst({
    where: { name: { startsWith: "Demo:" } },
  });
  if (!household) {
    household = await prisma.household.create({ data: { name: "Demo: Rivera Family" } });
  }

  let taxYear = await prisma.taxYear.findFirst({
    where: { householdId: household.id, year: 2025 },
  });

  if (!taxYear) {
    taxYear = await prisma.taxYear.create({
      data: { householdId: household.id, year: 2025, filingStatus: "MARRIED_FILING_JOINTLY" },
    });
    await prisma.dependent.createMany({ data: [
      { taxYearId: taxYear.id, firstName: "Sofia", lastName: "Rivera", dateOfBirth: "2016-04-12", relationship: "Child", months: 12 },
      { taxYearId: taxYear.id, firstName: "Marco", lastName: "Rivera", dateOfBirth: "2019-09-05", relationship: "Child", months: 12 },
    ]});
    await prisma.incomeItem.createMany({ data: [
      { taxYearId: taxYear.id, type: "FORM_1099_NEC", source: "Studio Clients", amount: "95000", withholding: "0" },
      { taxYearId: taxYear.id, type: "W2", source: "City School District", amount: "52000", withholding: "7200" },
    ]});
    await prisma.expenseItem.createMany({ data: [
      { taxYearId: taxYear.id, category: "HOME_OFFICE",       description: "Home studio",    amount: "6400",  businessPct: 100 },
      { taxYearId: taxYear.id, category: "AUTO",              description: "Vehicle",         amount: "9800",  businessPct: 72  },
      { taxYearId: taxYear.id, category: "SOFTWARE",          description: "Adobe CC, Figma", amount: "4200",  businessPct: 100 },
      { taxYearId: taxYear.id, category: "PHONE",             description: "iPhone plan",     amount: "2400",  businessPct: 80  },
      { taxYearId: taxYear.id, category: "PROFESSIONAL_FEES", description: "Accountant",      amount: "1800",  businessPct: 100 },
      { taxYearId: taxYear.id, category: "MARKETING",         description: "LinkedIn ads",    amount: "2200",  businessPct: 100 },
      { taxYearId: taxYear.id, category: "MEALS",             description: "Client lunches",  amount: "1600",  businessPct: 50  },
      { taxYearId: taxYear.id, category: "SUPPLIES",          description: "Office supplies", amount: "800",   businessPct: 100 },
    ]});
    await prisma.scenario.createMany({ data: [
      { taxYearId: taxYear.id, type: "CONSERVATIVE", name: "Conservative" },
      { taxYearId: taxYear.id, type: "BALANCED",     name: "Balanced"     },
      { taxYearId: taxYear.id, type: "AGGRESSIVE",   name: "Aggressive"   },
    ]});
  }

  await runAllScenarios(taxYear.id);
  await refreshAuditFlags(taxYear.id);
  redirect(`/tax-year/${taxYear.id}/optimize`);
}
