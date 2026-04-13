// lib/optimization/actions.ts
// Generates a deterministic pre-deadline action checklist.
// Items are context-aware: only shown when relevant to the user's data.

import { toCents } from "@/lib/money";
import type { ScenarioSnapshot, ActionItem } from "./types";

export function generateActionItems(
  scenarios: ScenarioSnapshot[]
): ActionItem[] {
  const balanced = scenarios.find(s => s.type === "BALANCED");
  if (!balanced) return defaultActions();

  const items: ActionItem[] = [];

  // 1. Always: review auto % (most common flag source)
  const autoItems = balanced.expenseItems.filter(e => e.category === "AUTO");
  if (autoItems.length > 0) {
    const maxPct = Math.max(...autoItems.map(e => e.businessPct));
    items.push({
      code:        "REVIEW_AUTO_PCT",
      label:       "Review vehicle business-use percentage",
      description: `Your auto expense is at ${maxPct}% business use. Prepare or update a mileage log to support this claim. Actual vs estimated business miles should be documented before filing.`,
      priority:    maxPct > 85 ? "HIGH" : "MEDIUM",
      done:        false,
    });
  }

  // 2. Always: confirm withholding
  if (toCents(balanced.totalWithholding) === 0) {
    items.push({
      code:        "REVIEW_WITHHOLDING",
      label:       "Set up estimated quarterly tax payments",
      description: `No withholding is recorded. If your estimated tax due exceeds $1,000, you're required to make quarterly payments (Form 1040-ES). Deadlines: Apr 15, Jun 15, Sep 15, Jan 15.`,
      priority:    parseFloat(balanced.amountDue) > 1000 ? "HIGH" : "MEDIUM",
      done:        false,
    });
  } else {
    items.push({
      code:        "CONFIRM_WITHHOLDING",
      label:       "Confirm withholding matches expected tax liability",
      description: `Verify that your W-2 withholding and/or estimated quarterly payments will cover your estimated total tax. Underpayment by more than $1,000 may trigger a penalty.`,
      priority:    "MEDIUM",
      done:        false,
    });
  }

  // 3. Home office — if present
  const homeOffice = balanced.expenseItems.filter(e => e.category === "HOME_OFFICE");
  if (homeOffice.length > 0) {
    items.push({
      code:        "DOCUMENT_HOME_OFFICE",
      label:       "Document home office space measurement",
      description: `Record the square footage of your dedicated workspace and total home square footage. This supports the home office deduction under IRC §280A. The space must be used regularly and exclusively for business.`,
      priority:    "MEDIUM",
      done:        false,
    });
  }

  // 4. Always: confirm dependent eligibility
  items.push({
    code:        "CONFIRM_DEPENDENTS",
    label:       "Confirm dependent and child credit eligibility",
    description: `Verify each dependent's age (under 17 for CTC), months in household (≥6), and relationship to primary taxpayer. The Child Tax Credit phases out starting at $400,000 AGI for MFJ.`,
    priority:    "HIGH",
    done:        false,
  });

  // 5. Meals — always relevant for self-employed
  const mealsItems = balanced.expenseItems.filter(e => e.category === "MEALS");
  if (mealsItems.length > 0) {
    items.push({
      code:        "REVIEW_MEALS_LIMIT",
      label:       "Verify meals expense amounts reflect 50% deductibility",
      description: `Business meals are only 50% deductible under IRC §274. Confirm whether the amounts entered are the full cost or the already-reduced 50% amount. The engine applies no additional reduction — this must be pre-calculated.`,
      priority:    "MEDIUM",
      done:        false,
    });
  }

  // 6. Always: gather documentation
  items.push({
    code:        "GATHER_DOCUMENTATION",
    label:       "Gather receipts and documentation for all deductions",
    description: `Ensure you have receipts, invoices, or bank statements supporting every expense item. Digital organization (by category) is recommended. Documentation should be kept for at least 3 years from filing date.`,
    priority:    "HIGH",
    done:        false,
  });

  // 7. If significant SE income — retirement contribution consideration
  if (toCents(balanced.grossSE) > toCents("30000")) {
    items.push({
      code:        "CONSIDER_SEP_IRA",
      label:       "Consider SEP-IRA or Solo 401(k) contribution before year-end",
      description: `With ${Math.round(parseFloat(balanced.grossSE)).toLocaleString()} in SE income, a SEP-IRA (up to 25% of net SE income, max $66,000 for 2024) or Solo 401(k) contribution can significantly reduce taxable income. Consult a tax professional for contribution limits and deadlines.`,
      priority:    "MEDIUM",
      done:        false,
    });
  }

  // 8. Always: review prior year
  items.push({
    code:        "COMPARE_PRIOR_YEAR",
    label:       "Compare to prior year return for major changes",
    description: `Review how this year's income, expenses, and credits compare to your prior return. Large deviations in expense ratios or income sources may warrant additional documentation or professional review.`,
    priority:    "LOW",
    done:        false,
  });

  // Sort: HIGH → MEDIUM → LOW
  const ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  items.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);

  return items;
}

function defaultActions(): ActionItem[] {
  return [
    {
      code:        "ADD_INCOME",
      label:       "Add income items to enable optimization",
      description: "Enter your 1099-NEC, W-2, or other income sources to generate personalized recommendations.",
      priority:    "HIGH",
      done:        false,
    },
    {
      code:        "RUN_SCENARIOS",
      label:       "Run scenarios to generate action items",
      description: "Go to the Scenarios tab and run all three scenarios. Action items will populate automatically.",
      priority:    "HIGH",
      done:        false,
    },
  ];
}
