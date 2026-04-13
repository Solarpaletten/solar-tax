// components/onboarding/ActionTimeline.tsx
// Three-phase timeline: Now / Before Dec 31 / At Filing
// Replaces generic action list with time-anchored behavioral guidance.

import { clsx } from "clsx";
import type { ActionItem } from "@/lib/optimization/types";

interface TimelinePhase {
  id:          string;
  label:       string;
  sublabel:    string;
  icon:        string;
  color:       string;
  borderColor: string;
  bgColor:     string;
  items:       ActionItem[];
}

function assignPhase(item: ActionItem): "now" | "dec31" | "filing" {
  const nowCodes    = new Set(["REVIEW_AUTO_PCT", "DOCUMENT_HOME_OFFICE", "GATHER_DOCUMENTATION", "REVIEW_MEALS_LIMIT"]);
  const dec31Codes  = new Set(["REVIEW_WITHHOLDING", "CONFIRM_WITHHOLDING", "CONSIDER_SEP_IRA", "CONFIRM_DEPENDENTS"]);
  const filingCodes = new Set(["COMPARE_PRIOR_YEAR", "ADD_INCOME", "RUN_SCENARIOS"]);

  if (nowCodes.has(item.code))    return "now";
  if (dec31Codes.has(item.code))  return "dec31";
  if (filingCodes.has(item.code)) return "filing";
  return item.priority === "HIGH" ? "now" : "dec31";
}

const PRIORITY_DOT: Record<string, string> = {
  HIGH:   "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW:    "bg-gray-600",
};

export function ActionTimeline({ items }: { items: ActionItem[] }) {
  const phases: TimelinePhase[] = [
    {
      id:          "now",
      label:       "Do now",
      sublabel:    "Before anything else",
      icon:        "🔴",
      color:       "text-red-400",
      borderColor: "border-red-800",
      bgColor:     "bg-red-950/30",
      items:       items.filter(i => assignPhase(i) === "now"),
    },
    {
      id:          "dec31",
      label:       "Before December 31",
      sublabel:    "Still time to change outcomes",
      icon:        "🟡",
      color:       "text-amber-400",
      borderColor: "border-amber-800",
      bgColor:     "bg-amber-950/20",
      items:       items.filter(i => assignPhase(i) === "dec31"),
    },
    {
      id:          "filing",
      label:       "At filing",
      sublabel:    "When you prepare your return",
      icon:        "🔵",
      color:       "text-blue-400",
      borderColor: "border-blue-800",
      bgColor:     "bg-blue-950/20",
      items:       items.filter(i => assignPhase(i) === "filing"),
    },
  ].filter(p => p.items.length > 0);

  if (phases.length === 0) return null;

  return (
    <div className="space-y-4">
      {phases.map((phase, idx) => (
        <div key={phase.id}>
          {/* Phase header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-base">{phase.icon}</span>
            <div>
              <p className={clsx("text-sm font-semibold", phase.color)}>{phase.label}</p>
              <p className="text-xs text-gray-600">{phase.sublabel}</p>
            </div>
            {/* Connector line to next phase */}
          </div>

          {/* Items */}
          <div className={clsx(
            "rounded-xl border space-y-0 divide-y divide-gray-800 overflow-hidden",
            phase.borderColor, phase.bgColor
          )}>
            {phase.items.map(item => (
              <div key={item.code} className="px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <span className={clsx(
                    "mt-1.5 flex-shrink-0 w-2 h-2 rounded-full",
                    PRIORITY_DOT[item.priority]
                  )} />
                  <div>
                    <p className="text-sm font-medium text-gray-200">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Arrow connector between phases */}
          {idx < phases.length - 1 && (
            <div className="flex justify-center my-1">
              <span className="text-gray-700 text-xs">↓</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
