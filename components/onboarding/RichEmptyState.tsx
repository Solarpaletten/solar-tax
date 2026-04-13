// components/onboarding/RichEmptyState.tsx
// Context-aware empty states. Never silent — always tells you what to do next.

import Link from "next/link";
import { loadDemo } from "@/actions/demo";

type Context =
  | "no-tax-years"    // dashboard, nothing exists
  | "no-income"       // workspace, income tab empty
  | "no-expenses"     // workspace, expenses tab empty
  | "no-scenarios"    // scenarios tab, no results yet
  | "no-optimization" // optimize, no results yet

interface Props {
  context:    Context;
  taxYearId?: string;
}

const CONFIG: Record<Context, {
  icon:        string;
  headline:    string;
  subline:     string;
  steps?:      string[];
  demoLabel?:  string;
  actionLabel: string;
  actionHref?: string;
}> = {
  "no-tax-years": {
    icon:        "☀",
    headline:    "Your tax strategy starts here",
    subline:     "Solar Tax Engine shows you how to optimize your taxes before the year ends — not just file them.",
    steps:       [
      "Create a household and tax year",
      "Enter your income and business expenses",
      "Run 3 scenarios and see which saves the most",
      "Get a personalized optimization plan",
    ],
    demoLabel:   "Try demo in one click →",
    actionLabel: "+ Create my first tax year",
  },

  "no-income": {
    icon:        "💰",
    headline:    "Add your income to get started",
    subline:     "Enter your 1099-NEC, W-2, or other sources. Solar calculates self-employment tax, AGI, and scenario differences automatically.",
    steps:       [
      "1099-NEC: freelance, consulting, contract work",
      "W-2: salaried employment (yours or spouse's)",
      "Include withholding — it affects your refund estimate",
    ],
    actionLabel: "+ Add first income item",
  },

  "no-expenses": {
    icon:        "🧾",
    headline:    "Expenses are where the optimization happens",
    subline:     "Business expenses reduce your taxable income. The business-use percentage is the lever — and Solar shows you exactly how it affects your taxes across 3 scenarios.",
    steps:       [
      "Auto / Vehicle: use actual business mileage",
      "Home Office: dedicated space, regular & exclusive use",
      "Software, phone, professional fees: common deductions",
      "Each % point you set is tested across all 3 scenarios",
    ],
    actionLabel: "+ Add first expense",
  },

  "no-scenarios": {
    icon:        "⚡",
    headline:    "Ready to simulate your tax outcomes",
    subline:     "Three scenarios — Conservative, Balanced, Aggressive — show you what happens when you adjust business-use percentages. Results update in real-time.",
    steps:       [
      "Each scenario inherits your income and expenses",
      "Adjust expense percentages per scenario",
      "See profit, SE tax, taxable income, credits, and refund side-by-side",
      "Delta indicators show which scenario improves the outcome",
    ],
    actionLabel: "Run scenarios →",
  },

  "no-optimization": {
    icon:        "✦",
    headline:    "Run scenarios to unlock the Optimization Engine",
    subline:     "Once your scenarios have results, Solar analyses them across 10 rules and tells you exactly what to change — and why.",
    steps:       [
      "Best scenario selected based on score, not just refund",
      "Rule-based recommendations with why/what/impact",
      "Apply suggestions directly from this page",
      "Pre-deadline action list with timeline",
    ],
    actionLabel: "Run scenarios first →",
  },
};

export async function RichEmptyState({ context, taxYearId }: Props) {
  const cfg = CONFIG[context];

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 px-8 py-10 text-center max-w-lg mx-auto">
      {/* Icon */}
      <div className="text-5xl mb-4">{cfg.icon}</div>

      {/* Headline */}
      <h2 className="text-xl font-semibold text-gray-100 mb-2">{cfg.headline}</h2>
      <p className="text-sm text-gray-400 leading-relaxed mb-6">{cfg.subline}</p>

      {/* Step list */}
      {cfg.steps && (
        <ul className="text-left space-y-2 mb-6 bg-gray-800/50 rounded-xl px-5 py-4">
          {cfg.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
              <span className="text-indigo-500 flex-shrink-0 font-semibold mt-0.5">
                {context === "no-income" || context === "no-expenses" ? "·" : `${i + 1}.`}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Demo CTA — only for no-tax-years */}
      {context === "no-tax-years" && (
        <form action={loadDemo} className="mb-3">
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            {cfg.demoLabel}
          </button>
        </form>
      )}

      {/* Primary action */}
      {cfg.actionHref ? (
        <Link
          href={cfg.actionHref}
          className="block w-full rounded-xl border border-gray-700 bg-gray-800 py-3 text-sm font-medium text-gray-200 hover:bg-gray-700 transition-colors"
        >
          {cfg.actionLabel}
        </Link>
      ) : (
        <p className="text-xs text-gray-600 mt-2">
          {context === "no-tax-years"
            ? "Or create your own household using the button above."
            : cfg.actionLabel}
        </p>
      )}

      {/* Tagline */}
      {context === "no-tax-years" && (
        <p className="text-xs text-gray-700 mt-4">
          Not just file taxes. Optimize the year. ☀
        </p>
      )}
    </div>
  );
}
