// lib/schemas.ts
// Zod validation schemas — single source of truth for all input validation

import { z } from "zod";

export const FilingStatusSchema = z.enum([
  "SINGLE",
  "MARRIED_FILING_JOINTLY",
  "MARRIED_FILING_SEPARATELY",
  "HEAD_OF_HOUSEHOLD",
]);

export const IncomeTypeSchema = z.enum([
  "W2",
  "FORM_1099_NEC",
  "FORM_1099_MISC",
  "FORM_1099_K",
  "INTEREST",
  "DIVIDEND",
  "OTHER",
]);

export const ExpenseCategorySchema = z.enum([
  "AUTO",
  "PHONE",
  "HOME_OFFICE",
  "SUPPLIES",
  "MEALS",
  "TRAVEL",
  "INSURANCE",
  "SOFTWARE",
  "MARKETING",
  "PROFESSIONAL_FEES",
  "OTHER",
]);

export const ScenarioTypeSchema = z.enum([
  "CONSERVATIVE",
  "BALANCED",
  "AGGRESSIVE",
  "CUSTOM",
]);

export const AuditFlagSeveritySchema = z.enum(["INFO", "WARNING", "CRITICAL"]);

// ─── Action Schemas ───────────────────────────────────────────────────────────

export const CreateHouseholdSchema = z.object({
  name: z.string().min(1, "Household name is required").max(100),
});

export const CreateTaxYearSchema = z.object({
  householdId: z.string().cuid(),
  year: z.number().int().min(2020).max(2030),
  filingStatus: FilingStatusSchema.optional().default("MARRIED_FILING_JOINTLY"),
});

export const AddIncomeItemSchema = z.object({
  taxYearId: z.string().cuid(),
  type: IncomeTypeSchema,
  source: z.string().min(1, "Source / payer name is required").max(200),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid dollar amount"),
  withholding: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid dollar amount")
    .optional()
    .default("0"),
  notes: z.string().max(500).optional(),
});

export const AddExpenseItemSchema = z.object({
  taxYearId: z.string().cuid(),
  category: ExpenseCategorySchema,
  description: z.string().min(1, "Description is required").max(200),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid dollar amount"),
  businessPct: z.number().int().min(0).max(100).default(100),
  notes: z.string().max(500).optional(),
});

export const UpdateIncomeItemSchema = AddIncomeItemSchema.extend({
  id: z.string().cuid(),
}).omit({ taxYearId: true });

export const UpdateExpenseItemSchema = AddExpenseItemSchema.extend({
  id: z.string().cuid(),
}).omit({ taxYearId: true });

export const AddDependentSchema = z.object({
  taxYearId: z.string().cuid(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  dateOfBirth: z.string(), // ISO date string YYYY-MM-DD
  relationship: z.string().min(1).max(50),
  months: z.number().int().min(1).max(12).default(12),
  ssn: z.string().optional(), // stored encrypted — not implemented in MVP
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type FilingStatus = z.infer<typeof FilingStatusSchema>;
export type IncomeType = z.infer<typeof IncomeTypeSchema>;
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;
export type ScenarioType = z.infer<typeof ScenarioTypeSchema>;
