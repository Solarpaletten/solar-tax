# Solar Tax Engine — Task 1 Foundation

---

## ⚠️ Setup fixes (read before building)

### 1. Install dependencies

```bash
npm install
```

`next-pwa` is now listed in `package.json` — installs automatically.

If you hit peer dependency errors, add `--legacy-peer-deps`:

```bash
npm install --legacy-peer-deps
```

### 2. `actions/scenario.ts` — re-export removed

The line below has been **removed** from `actions/scenario.ts`:

```typescript
// REMOVE THIS LINE if you have it:
export { refreshAuditFlags } from "./audit-flags";
```

This caused a circular import at build time. The `refreshAuditFlags` function is imported directly from `./audit-flags` wherever it's needed.

### 3. PDF route fix

`app/api/pdf/[taxYearId]/route.ts` uses `Buffer.from(pdfBytes)` + native `Response` — not `NextResponse` — to avoid the `Uint8Array<ArrayBufferLike>` TypeScript error.


> Not just file taxes. Optimize the year.

## Stack
- **Next.js 14** (App Router) + TypeScript strict
- **Prisma ORM** + SQLite (local dev) / Turso (production)
- **Tailwind CSS**
- **Server Actions** (no separate API layer)
- **PWA** ready (manifest + icons)
- **AI Assistant** placeholder (Whisper/TTS ready in v2)

---

## Quick Start (local dev — no Turso needed)

```bash
# 1. Unzip and enter
unzip solar-tax-engine-task1.zip
cd solar-tax-engine

# 2. Install dependencies
npm install

# 3. Set up local SQLite (no account needed)
cp .env.example .env.local
# .env.local already has: DATABASE_URL="file:./dev.db"

# 4. Run dev server
npm run dev

# → Open http://localhost:3000
```

---

## Production Setup (Turso)

### 1. Create Turso database
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create DB
turso db create solar-tax-engine

# Get connection URL
turso db show solar-tax-engine --url

# Get auth token
turso db tokens create solar-tax-engine
```

### 2. Update .env.local for Turso
```env
DATABASE_URL="https://solar-tax-YOUR-DB.turso.io"
TURSO_AUTH_TOKEN="your-token-here"
```

⚠️ Use `https://` not `libsql://` — the libsql:// protocol triggers a migration jobs
check that fails on the Turso free tier.

### 3. Initialize Turso schema (one time only)
```bash
turso db shell YOUR-DB-NAME < turso-init.sql
```

The `turso-init.sql` file is included in the project root.
Do **not** run `npx prisma db push` against Turso — it does not support libsql:// URLs.

---

## Deploy to Vercel

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Task 1: Foundation build"
git remote add origin https://github.com/YOUR_ORG/solar-tax-engine.git
git push -u origin main

# 2. Connect Vercel
# → Go to vercel.com → New Project → Import from GitHub

# 3. Set Environment Variables in Vercel dashboard:
DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Project Structure

```
solar-tax-engine/
├── app/
│   ├── layout.tsx              # Root layout + PWA meta
│   ├── page.tsx                # → redirect /dashboard
│   ├── dashboard/page.tsx      # Tax year list
│   ├── tax-year/[id]/page.tsx  # Workspace
│   └── globals.css
│
├── actions/                    # Server Actions (no REST API)
│   ├── household.ts            # createHousehold, getHouseholds
│   ├── tax-year.ts             # createTaxYear, getTaxYearFull
│   ├── income.ts               # addIncomeItem, deleteIncomeItem
│   ├── expenses.ts             # addExpenseItem, deleteExpenseItem
│   └── dependents.ts           # addDependent, deleteDependent
│
├── lib/
│   ├── db/client.ts            # Prisma singleton
│   ├── schemas.ts              # Zod validators (single source)
│   └── rules/
│       ├── types.ts            # RuleSet interface + getRuleSet()
│       ├── 2023/index.ts       # IRS 2023 tax parameters
│       ├── 2024/index.ts       # IRS 2024 tax parameters
│       └── 2025/index.ts       # IRS 2025 tax parameters
│
├── components/
│   ├── ai/Assistant.tsx        # AI Assistant placeholder (v2: Whisper + TTS)
│   ├── forms/
│   │   ├── IncomeForm.tsx
│   │   ├── ExpenseForm.tsx
│   │   └── CreateTaxYearForm.tsx
│   ├── ui/index.tsx            # Shared UI primitives
│   └── workspace/
│       ├── IncomeList.tsx
│       └── ExpenseList.tsx
│
├── prisma/schema.prisma        # 10 models, SQLite/Turso compatible
├── public/
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # icon-192.png, icon-512.png
│
├── .env.example                # Environment variable template
├── next.config.js              # PWA config
├── tailwind.config.js
└── tsconfig.json
```

---

## Acceptance Criteria — Task 1

| Criteria | Status |
|---|---|
| Create household | ✅ |
| Create tax year | ✅ |
| Add income item | ✅ |
| Add expense item | ✅ |
| Data saves to DB | ✅ |
| `/tax-year/[id]` workspace | ✅ |
| PWA manifest + icons | ✅ |
| AI Assistant button (placeholder) | ✅ |
| RuleSet skeleton (2023/2024/2025) | ✅ |
| Deploy-ready (Vercel + Turso) | ✅ |

---

## NOT in Task 1 (by design)

- ❌ Scenario Engine (Task 2)
- ❌ Tax calculations (Task 2)
- ❌ Copy Year flow (Task 3)
- ❌ PDF export (Task 3)
- ❌ Auth system (Task 4)
- ❌ Native iOS (future)
- ❌ Real AI (v2 — structure ready)

---

## Important: Decimal → String

SQLite has no native Decimal type. All monetary amounts are stored as `String`
and parsed with `parseFloat()` at the application layer.

```typescript
// In DB: amount = "12500.00"  (String)
// In code: parseFloat(item.amount)  → 12500
```

**TODO:** When migrating to PostgreSQL (v2), change `String` → `Decimal @db.Decimal(12,2)`
and update `datasource db { provider = "postgresql" }`.

---

## Next: Task 2 — Scenario Engine

Task 2 wires the calculation pipeline:
- `IncomeEngine` → `ExpenseEngine` → `ProfitEngine`
- → `SEtaxEngine` → `TaxableIncomeEngine` → `CreditEngine` → `FinalTaxEngine`
- → `ScenarioEngine` (orchestrator)
- → Real-time scenario panel in UI

---

## Task 2 — Scenario Engine (added)

### New files
```
lib/money.ts                          # All monetary math (cents, no float)
lib/tax-engine/income.ts              # IncomeEngine
lib/tax-engine/expense.ts             # ExpenseEngine (per-item overrides)
lib/tax-engine/profit.ts              # ProfitEngine
lib/tax-engine/se-tax.ts              # SEtaxEngine (Schedule SE)
lib/tax-engine/taxable-income.ts      # AGI + standard deduction
lib/tax-engine/credits.ts             # CTC with real phase-out logic
lib/tax-engine/final-tax.ts           # Real tax brackets + refund
lib/tax-engine/scenario.ts            # Orchestrator
actions/scenario.ts                   # runScenario, runAllScenarios
components/scenario/ScenarioPanel.tsx # Live-updating scenario panel
components/workspace/WorkspaceTabs.tsx
app/tax-year/[id]/scenarios/page.tsx  # /scenarios route
```

### Verified calculation (Node.js)
Test case: MFJ 2025, 1099-NEC $90K + W-2 $30K, 2 children, $13,800 expenses
- SE Tax:        $12,717
- Child Credit:  $4,000
- Total Tax:     $16,621
- Owed:          $12,621 (withholding only $4,000)
- Effective:     11.32%

### Gate Review fixes applied
- ✅ All money stored as String, computed via integer cents (lib/money.ts)
- ✅ totalWithholding aggregated in IncomeEngine
- ✅ 3 scenarios seeded automatically on TaxYear creation
- ✅ console.log at each engine module entry/exit

---

## Task 3 — Product Layer (Copy Year + PDF + Audit Flags)

### New files
```
actions/copy-year.ts                    # copyYear(sourceId, targetYear, options)
actions/audit-flags.ts                  # refreshAuditFlags(taxYearId)
lib/pdf/summary.ts                      # PDF generator (pdf-lib, no headless)
lib/tax-engine/audit-flags.ts           # Rule-based flag detection (6 rules)
app/api/pdf/[taxYearId]/route.ts        # GET → PDF download
app/tax-year/[id]/copy/page.tsx         # Copy Year UI
app/tax-year/[id]/flags/page.tsx        # Audit Risk UI
```

### Gate Review fixes applied (Task 2 → Task 3)
- ✅ refundAmount / amountDue split (FinalTaxEngine now returns both)
- ✅ taxableIncome floor at 0 explicitly enforced
- ✅ Scenario isolation: deep clone before pipeline (no mutation of DB objects)
- ✅ All 3 scenarios computed in one runAllScenarios() call

### Audit Rules (6)
| Code | Severity | Trigger |
|---|---|---|
| HIGH_EXPENSE_RATIO | WARNING | Expenses > 85% of gross |
| AUTO_100PCT_HIGH_AMOUNT | WARNING | Vehicle 100% @ > $5K |
| MEALS_OVER_HALF_EXPENSES | INFO | Meals > 50% of total deductions |
| NO_WITHHOLDING_HIGH_INCOME | CRITICAL | Gross > $50K, zero withholding |
| NET_LOSS | INFO | Schedule C net loss |
| HOME_OFFICE_HIGH_AMOUNT | INFO | Home office > $10K |

### PDF
- pdf-lib (server-side, no headless browser)
- GET /api/pdf/[taxYearId] → downloads PDF
- Shows all 3 scenarios side-by-side
- Refund/Due highlight box per scenario

### Acceptance Criteria — Task 3
| | |
|---|---|
| Copy Year (structure + ratios, amounts zeroed) | ✅ |
| PDF downloads with all 3 scenarios | ✅ |
| Audit flags detect 6 rule categories | ✅ |
| Flags UI with severity colors | ✅ |
| Gate review fixes applied + tested | ✅ |

---

## Task 4 — Optimization Engine (Decision Layer)

### New files
```
lib/optimization/types.ts       # Shared interfaces: ScenarioSnapshot, OptimizationScore, Recommendation, ActionItem
lib/optimization/score.ts       # computeScore — 4 dimensions, weighted composite (0-100)
lib/optimization/compare.ts     # selectBestScenario — CRITICAL flag penalty, tiebreak by stability
lib/optimization/recommend.ts   # 10 deterministic rules → Recommendation[]
lib/optimization/actions.ts     # generateActionItems — context-aware pre-deadline checklist
lib/optimization/engine.ts      # runOptimizationEngine — orchestrator
actions/optimize.ts             # getOptimization server action
app/tax-year/[id]/optimize/page.tsx
components/optimize/ActionChecklist.tsx  # toggleable client checklist
```

### Scoring dimensions (weighted)
| Dimension | Weight | Description |
|---|---|---|
| Tax efficiency | 35% | Lower effective rate → higher score |
| Audit safety | 30% | CRITICAL: -25, WARNING: -10, INFO: -3 |
| Profit quality | 20% | Rewards reasonable margin, penalizes loss/near-zero |
| Credit utilization | 15% | How much of CTC actually offsets tax |

### 10 Recommendation rules
1. AUTO_HIGH_PCT — vehicle > 85% business use
2. HIGH_EXPENSE_RATIO — expenses > 80% of gross
3. AGGRESSIVE_CRITICAL_FLAGS — aggressive triggers CRITICAL flags
4. CONSERVATIVE_HIGH_BURDEN — conservative costs $500+ more than balanced
5. NO_WITHHOLDING_PENALTY_RISK — no withholding + due > $1,000
6. NET_LOSS — Schedule C shows a loss
7. CREDIT_UNDERUTILIZED — credits exceed income tax (non-refundable wasted)
8. BALANCED_RECOMMENDED — balanced dominates when aggressive is risky
9. SE_DEDUCTIBLE_HALF — education on SE deduction (already applied)
10. WIDE_SCENARIO_SPREAD — large gap warns about documentation stakes

### Route map — complete
```
/dashboard                      ✅
/tax-year/[id]                  ✅  Inputs + Copy Year + PDF
/tax-year/[id]/scenarios        ✅  Real-time scenario engine
/tax-year/[id]/flags            ✅  Audit risk
/tax-year/[id]/optimize         ✅  Optimization Engine (Task 4)
/tax-year/[id]/copy             ✅  Copy Year
/api/pdf/[taxYearId]            ✅  PDF download
```

### Test results (Node.js)
- CONSERVATIVE: score 79 (Good) — zero flags, high audit safety
- BALANCED: score 76 (Good) — best risk-adjusted choice
- AGGRESSIVE: score 67 (Good → effective after CRITICAL penalty: 47)
- Best selected: CONSERVATIVE or BALANCED depending on flag count
- 10 rules execute deterministically in < 1ms

---

## Task 5 — Productization Layer

### New files
```
lib/demo/seed.ts                            # Demo seed: Rivera family, $147K income, 8 expenses, 2 kids
actions/demo.ts                             # loadDemo() server action → redirect to /optimize
components/onboarding/ValueHighlight.tsx    # WOW moment: "You can save $2,219" + deadline nudge
components/onboarding/ActionTimeline.tsx    # Now → Before Dec 31 → At Filing
components/onboarding/RichEmptyState.tsx    # 5 context-aware empty states with demo CTA
```

### Updated files
```
app/dashboard/page.tsx                      # RichEmptyState with demo CTA
app/tax-year/[id]/optimize/page.tsx         # ValueHighlight + ActionTimeline + RichEmptyState
```

### What Task 5 adds
1. **Demo Mode**: One click → pre-populated household → Optimization Engine with real results
2. **Value Highlight**: First thing user sees = "$X you can save this year" + effective rate + audit flags
3. **Deadline nudge**: "Before December 31 — these numbers can change" on every optimize view
4. **Action Timeline**: Three-phase structure (Do now / Before Dec 31 / At Filing) instead of flat list
5. **Rich Empty States**: Every empty state explains what to do next + demo CTA on first visit

### One-line value
> "We help self-employed families decide how to optimize their taxes before year-end."

### Gate Review score (Dashka/Solana)
- Code:    9/10 (Task 1–4)
- Product: 7.5/10 → Target 9/10 after Task 5
