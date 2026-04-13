// lib/reporting/format.ts
// Formatting utilities for IRS report display

export function fmtDollar(value: string | number | undefined): string {
  if (!value) return "0";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function fmtDollarFull(value: string | number | undefined): string {
  return "$" + fmtDollar(value);
}

export function fmtPct(value: string | number | undefined): string {
  if (!value) return "0%";
  const n = typeof value === "string" ? parseFloat(value) : value;
  return n.toFixed(1) + "%";
}

export function filingStatusLabel(status: string): string {
  const map: Record<string, string> = {
    SINGLE:                    "Single",
    MARRIED_FILING_JOINTLY:    "Married Filing Jointly",
    MARRIED_FILING_SEPARATELY: "Married Filing Separately",
    HEAD_OF_HOUSEHOLD:         "Head of Household",
    QUALIFYING_SURVIVING_SPOUSE: "Qualifying Surviving Spouse",
  };
  return map[status] ?? status;
}

export function expenseCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    HOME_OFFICE:       "Home Office",
    AUTO:              "Auto & Travel",
    SOFTWARE:          "Software & Tools",
    PHONE:             "Phone",
    PROFESSIONAL_FEES: "Professional Fees",
    MARKETING:         "Marketing",
    MEALS:             "Meals (50%)",
    SUPPLIES:          "Supplies",
    OTHER:             "Other",
  };
  return map[cat] ?? cat;
}
