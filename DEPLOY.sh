#!/bin/bash
# =============================================================================
# SOLAR TAX ENGINE — DEPLOY SCRIPT
# Run this from the project root after cloning.
# Estimated time: ~15 minutes for first deploy.
# =============================================================================

echo ""
echo "☀  Solar Tax Engine — Deploy Guide"
echo "======================================"
echo ""

# =============================================================================
# STEP 1: GITHUB
# =============================================================================
echo "STEP 1 — Push to GitHub"
echo "------------------------"
cat << 'INSTRUCTIONS'

  git init
  git add .
  git commit -m "feat: Solar Tax Engine — Task 1-5 complete"

  # Create repo at github.com/new (private or public)
  git remote add origin https://github.com/YOUR_USERNAME/solar-tax-engine.git
  git push -u origin main

INSTRUCTIONS

# =============================================================================
# STEP 2: TURSO DATABASE
# =============================================================================
echo "STEP 2 — Create Turso database"
echo "--------------------------------"
cat << 'INSTRUCTIONS'

  # Install Turso CLI (macOS/Linux)
  curl -sSfL https://get.tur.so/install.sh | bash

  # Login
  turso auth login

  # Create database (name it anything)
  turso db create solar-tax-engine

  # Get your connection URL (copy this for Vercel env)
  turso db show solar-tax-engine --url
  # Output: libsql://solar-tax-engine-YOUR_ORG.turso.io

  # Create auth token (copy this for Vercel env)
  turso db tokens create solar-tax-engine
  # Output: eyJhb...  (long JWT token)

INSTRUCTIONS

# =============================================================================
# STEP 3: PUSH SCHEMA TO TURSO
# =============================================================================
echo "STEP 3 — Initialize database schema"
echo "-------------------------------------"
cat << 'INSTRUCTIONS'

  # Update .env.local with your Turso credentials:
  #   DATABASE_URL="libsql://solar-tax-engine-YOUR_ORG.turso.io"
  #   TURSO_AUTH_TOKEN="your-token-here"

  # Update prisma/schema.prisma — add this to datasource block:
  #   relationMode = "prisma"

  # Push schema (creates all 10 tables)
  npx prisma db push

  # Verify tables created:
  turso db shell solar-tax-engine ".tables"
  # Should show: Household, TaxYear, IncomeItem, ExpenseItem, ...

INSTRUCTIONS

# =============================================================================
# STEP 4: VERCEL DEPLOY
# =============================================================================
echo "STEP 4 — Deploy to Vercel"
echo "--------------------------"
cat << 'INSTRUCTIONS'

  OPTION A: Via Vercel dashboard (recommended for first deploy)
  ─────────────────────────────────────────────────────────────
  1. Go to vercel.com → New Project
  2. Import from GitHub → select solar-tax-engine
  3. Framework preset: Next.js (auto-detected)
  4. Add Environment Variables:

     DATABASE_URL
     → libsql://solar-tax-engine-YOUR_ORG.turso.io

     TURSO_AUTH_TOKEN
     → eyJhb... (your token)

     NEXT_PUBLIC_APP_URL
     → https://solar-tax-engine.vercel.app (your domain)

  5. Click Deploy → wait ~2 minutes
  6. Open your URL → should redirect to /dashboard

  OPTION B: Via Vercel CLI
  ─────────────────────────
  npm i -g vercel
  vercel login
  vercel --prod
  # Answer prompts, set env vars when asked

INSTRUCTIONS

# =============================================================================
# STEP 5: POST-DEPLOY VERIFICATION
# =============================================================================
echo "STEP 5 — Verify deployment"
echo "---------------------------"
cat << 'INSTRUCTIONS'

  Open your Vercel URL. Expected flow:

  1. /dashboard → empty state with "Try demo in one click →"
  2. Click demo → /tax-year/[id]/optimize loads
  3. See "You can save $X" value highlight
  4. Check 3 scenario panels (Conservative / Balanced / Aggressive)
  5. Check Recommendations (type / why / what / impact)
  6. Check Action Timeline (Now / Before Dec 31 / At Filing)
  7. Click "↓ PDF" → PDF downloads
  8. Check Audit Risk tab → flags appear

  If /optimize shows empty state instead of results:
  → The scenarios ran but results need refreshing.
  → Go to /tax-year/[id]/scenarios → wait 2s → go back to /optimize.

INSTRUCTIONS

# =============================================================================
# STEP 6: SHARE FOR USER TESTING
# =============================================================================
echo "STEP 6 — User testing (5-10 people)"
echo "-------------------------------------"
cat << 'INSTRUCTIONS'

  Target users:
  ✓ Self-employed freelancers / consultants
  ✓ Small business owners who file personal returns
  ✓ Married couples with mixed income (W-2 + 1099)
  ✓ Families with children (CTC claimers)

  Message to send:
  ─────────────────
  "Hey — I built something that helps self-employed people
  optimize their taxes BEFORE year-end, not just file them.

  Can you try it in 5 minutes and tell me:
  1. Did you understand what it does?
  2. Was the 'You can save $X' number useful?
  3. What was confusing?

  Link: https://YOUR-APP.vercel.app

  (Click 'Try demo in one click' to see it without entering data)"

  What to watch:
  ✓ Do they understand the product in <10 seconds?
  ✓ Do they react to the savings number?
  ✓ Do they try to enter their own data?
  ✓ Where do they get stuck?

INSTRUCTIONS

echo ""
echo "======================================"
echo "☀  Deploy guide complete."
echo "Total estimated time: 15–20 min"
echo "======================================"
