-- Solar Tax Engine — Turso Schema Init
-- Run with: turso db shell YOUR-DB-NAME < turso-init.sql
-- Or paste into: turso db shell YOUR-DB-NAME

CREATE TABLE IF NOT EXISTS "Household" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Taxpayer" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "firstName"   TEXT NOT NULL,
  "lastName"    TEXT NOT NULL,
  "ssn"         TEXT,
  "isPrimary"   INTEGER NOT NULL DEFAULT 1,
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Taxpayer_householdId_idx" ON "Taxpayer"("householdId");

CREATE TABLE IF NOT EXISTS "TaxYear" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "householdId"  TEXT NOT NULL,
  "year"         INTEGER NOT NULL,
  "filingStatus" TEXT NOT NULL DEFAULT 'MARRIED_FILING_JOINTLY',
  "state"        TEXT,
  "notes"        TEXT,
  "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE,
  UNIQUE ("householdId", "year")
);
CREATE INDEX IF NOT EXISTS "TaxYear_householdId_idx" ON "TaxYear"("householdId");

CREATE TABLE IF NOT EXISTS "Dependent" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "taxYearId"    TEXT NOT NULL,
  "firstName"    TEXT NOT NULL,
  "lastName"     TEXT NOT NULL,
  "ssn"          TEXT,
  "dateOfBirth"  TEXT NOT NULL,
  "relationship" TEXT NOT NULL,
  "months"       INTEGER NOT NULL DEFAULT 12,
  FOREIGN KEY ("taxYearId") REFERENCES "TaxYear"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Dependent_taxYearId_idx" ON "Dependent"("taxYearId");

CREATE TABLE IF NOT EXISTS "IncomeItem" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "taxYearId"   TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "source"      TEXT NOT NULL,
  "amount"      TEXT NOT NULL DEFAULT '0',
  "withholding" TEXT NOT NULL DEFAULT '0',
  "notes"       TEXT,
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("taxYearId") REFERENCES "TaxYear"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IncomeItem_taxYearId_idx" ON "IncomeItem"("taxYearId");

CREATE TABLE IF NOT EXISTS "ExpenseItem" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "taxYearId"   TEXT NOT NULL,
  "category"    TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount"      TEXT NOT NULL DEFAULT '0',
  "businessPct" INTEGER NOT NULL DEFAULT 100,
  "notes"       TEXT,
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("taxYearId") REFERENCES "TaxYear"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ExpenseItem_taxYearId_idx" ON "ExpenseItem"("taxYearId");

CREATE TABLE IF NOT EXISTS "Scenario" (
  "id"               TEXT NOT NULL PRIMARY KEY,
  "taxYearId"        TEXT NOT NULL,
  "type"             TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "expenseOverrides" TEXT,
  "incomeOverrides"  TEXT,
  "notes"            TEXT,
  "createdAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("taxYearId") REFERENCES "TaxYear"("id") ON DELETE CASCADE,
  UNIQUE ("taxYearId", "type")
);
CREATE INDEX IF NOT EXISTS "Scenario_taxYearId_idx" ON "Scenario"("taxYearId");

CREATE TABLE IF NOT EXISTS "ScenarioResult" (
  "id"               TEXT NOT NULL PRIMARY KEY,
  "scenarioId"       TEXT NOT NULL UNIQUE,
  "grossIncome"      TEXT NOT NULL DEFAULT '0',
  "totalExpenses"    TEXT NOT NULL DEFAULT '0',
  "allowedExpenses"  TEXT NOT NULL DEFAULT '0',
  "netProfit"        TEXT NOT NULL DEFAULT '0',
  "seTax"            TEXT NOT NULL DEFAULT '0',
  "deductibleSEhalf" TEXT NOT NULL DEFAULT '0',
  "agi"              TEXT NOT NULL DEFAULT '0',
  "standardDeduction" TEXT NOT NULL DEFAULT '0',
  "taxableIncome"    TEXT NOT NULL DEFAULT '0',
  "childTaxCredit"   TEXT NOT NULL DEFAULT '0',
  "totalCredits"     TEXT NOT NULL DEFAULT '0',
  "taxOwed"          TEXT NOT NULL DEFAULT '0',
  "totalWithholding" TEXT NOT NULL DEFAULT '0',
  "refund"           TEXT NOT NULL DEFAULT '0',
  "effectiveRate"    TEXT NOT NULL DEFAULT '0',
  "calculatedAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "TaxCalculation" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "taxYearId"   TEXT NOT NULL,
  "ruleSetYear" INTEGER NOT NULL,
  "inputHash"   TEXT NOT NULL,
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("taxYearId") REFERENCES "TaxYear"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "TaxCalculation_taxYearId_idx" ON "TaxCalculation"("taxYearId");

CREATE TABLE IF NOT EXISTS "AuditFlag" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "taxYearId" TEXT NOT NULL,
  "code"      TEXT NOT NULL,
  "severity"  TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "detail"    TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("taxYearId") REFERENCES "TaxYear"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "AuditFlag_taxYearId_idx" ON "AuditFlag"("taxYearId");
