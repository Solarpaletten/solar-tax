// lib/demo/seed.ts
// Demo Mode: creates a realistic pre-populated household so users see value
// without entering any data. Can be triggered from onboarding or /demo route.
// Idempotent — checks for existing demo household before creating.

import { prisma } from "@/lib/db/client";
import { ensureDb } from "@/lib/db/init";

const DEMO_HOUSEHOLD_NAME = "Demo: Rivera Family";
const DEMO_YEAR = 2025;

export interface DemoResult {
  taxYearId: string;
  householdId: string;
  isNew: boolean;
}

export async function ensureDemoData(): Promise<DemoResult> {
  await ensureDb();
  // Check if demo already exists
  const existing = await prisma.household.findFirst({
    where: { name: DEMO_HOUSEHOLD_NAME },
    include: { taxYears: { take: 1 } },
  });

  if (existing?.taxYears[0]) {
    return {
      taxYearId:   existing.taxYears[0].id,
      householdId: existing.id,
      isNew:       false,
    };
  }

  // Create household
  const household = await prisma.household.create({
    data: { name: DEMO_HOUSEHOLD_NAME },
  });

  // Create 2025 tax year
  const taxYear = await prisma.taxYear.create({
    data: {
      householdId:  household.id,
      year:         DEMO_YEAR,
      filingStatus: "MARRIED_FILING_JOINTLY",
      notes:        "Demo data — shows Solar Tax Engine at its best",
    },
  });

  // ── Dependents (2 qualifying children) ──────────────────────────────────
  await prisma.dependent.createMany({
    data: [
      {
        taxYearId:    taxYear.id,
        firstName:    "VASIL",
        lastName:     "SINIAHUB",
        dateOfBirth:  "2016-04-12",   // age 9 — qualifies for CTC
        relationship: "Husband",
        months:       12,
      },
      {
        taxYearId:    taxYear.id,
        firstName:    "SVIATLIANA",
        lastName:     "SINIAHUB",
        dateOfBirth:  "2019-09-05",   // age 5 — qualifies for CTC
        relationship: "Wooman",
        months:       12,
      },
    ],
  });

  // ── Income ───────────────────────────────────────────────────────────────
  // Marco Rivera: freelance designer (1099-NEC) + spouse W-2
  await prisma.incomeItem.createMany({
    data: [
      {
        taxYearId:   taxYear.id,
        type:        "FORM_1099_NEC",
        source:      "Studio Clients (design)",
        amount:      "8631",
        withholding: "0",
        notes:       "Primary SE income",
      },
      {
        taxYearId:   taxYear.id,
        type:        "W2",
        source:      "City School District (spouse)",
        amount:      "8",
        withholding: "0",
        notes:       "Spouse W-2",
      },
    ],
  });

  // ── Expenses ─────────────────────────────────────────────────────────────
  await prisma.expenseItem.createMany({
    data: [
      {
        taxYearId:   taxYear.id,
        category:    "HOME_OFFICE",
        description: "Home studio (dedicated room, 180 sq ft)",
        amount:      "6400",
        businessPct: 100,
      },
      {
        taxYearId:   taxYear.id,
        category:    "AUTO",
        description: "Vehicle — client visits & supply runs",
        amount:      "9800",
        businessPct: 72,   // intentionally under 85% — passes audit flags
      },
      {
        taxYearId:   taxYear.id,
        category:    "SOFTWARE",
        description: "Adobe CC, Figma, Notion, hosting",
        amount:      "4200",
        businessPct: 100,
      },
      {
        taxYearId:   taxYear.id,
        category:    "PHONE",
        description: "iPhone plan + hardware",
        amount:      "2400",
        businessPct: 80,
      },
      {
        taxYearId:   taxYear.id,
        category:    "PROFESSIONAL_FEES",
        description: "Accountant, legal, business filing",
        amount:      "1800",
        businessPct: 100,
      },
      {
        taxYearId:   taxYear.id,
        category:    "MARKETING",
        description: "Portfolio site, LinkedIn ads, print materials",
        amount:      "2200",
        businessPct: 100,
      },
      {
        taxYearId:   taxYear.id,
        category:    "MEALS",
        description: "Client lunches and team meals",
        amount:      "1600",
        businessPct: 50,   // pre-limited to 50% deductible
      },
      {
        taxYearId:   taxYear.id,
        category:    "SUPPLIES",
        description: "Office supplies, paper, printer ink",
        amount:      "800",
        businessPct: 100,
      },
    ],
  });

  // ── Scenarios (3 default) ────────────────────────────────────────────────
  // Conservative: all at base %
  // Balanced: slight uplifts (auto 72→80, phone 80→90)
  // Aggressive: auto at 95%, home office at 100, marketing all in
  await prisma.scenario.createMany({
    data: [
      {
        taxYearId: taxYear.id,
        type:      "CONSERVATIVE",
        name:      "Conservative",
        expenseOverrides: null,
      },
      {
        taxYearId: taxYear.id,
        type:      "BALANCED",
        name:      "Balanced",
        expenseOverrides: null,   // uses base %s — balanced for this household
      },
      {
        taxYearId:        taxYear.id,
        type:             "AGGRESSIVE",
        name:             "Aggressive",
        expenseOverrides: JSON.stringify({
          // These will be matched by ID after creation — handled in seed action
          "__auto__": 92,     // marker: overrideAutoTo
          "__phone__": 100,
        }),
        notes: "Demo aggressive: higher vehicle and phone claims",
      },
    ],
  });

  console.log("[DemoSeed] Created demo household", {
    householdId: household.id,
    taxYearId:   taxYear.id,
  });

  return { taxYearId: taxYear.id, householdId: household.id, isNew: true };
}
