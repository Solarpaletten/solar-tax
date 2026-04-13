// components/onboarding/ValueHighlight.tsx
// The "WOW moment" component.
// Shows the most impactful single number on screen — before the user reads anything else.
// Called from /optimize and /scenarios.

import { formatMoney } from "@/lib/money";
import { clsx } from "clsx";

interface Props {
  conservativeAmount: number;  // amount due (positive) or refund (negative)
  bestAmount: number;
  bestScenarioName: string;
  conservativeIsRefund: boolean;
  bestIsRefund: boolean;
  effectiveRate: string;
  auditFlagsCount: number;
}

function delta(a: number, b: number): number {
  // Difference: positive = improvement (more refund or less due)
  return b - a;
}

export function ValueHighlight({
  conservativeAmount,
  bestAmount,
  bestScenarioName,
  conservativeIsRefund,
  bestIsRefund,
  effectiveRate,
  auditFlagsCount,
}: Props) {
  // conservativeAmount and bestAmount are both expressed as "net position"
  // positive = refund, negative = amount owed
  const improvement = delta(conservativeAmount, bestAmount);
  const hasImprovement = improvement > 100; // only show if meaningful

  const rateNum = parseFloat(effectiveRate);
  const rateColor =
    rateNum < 15 ? "text-green-400" :
    rateNum < 25 ? "text-amber-400" :
    "text-red-400";

  return (
    <div className="rounded-2xl border border-indigo-800 bg-gradient-to-br from-indigo-950/60 to-gray-900 px-6 py-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Column 1: Main value delta */}
        <div className="sm:col-span-2">
          {hasImprovement ? (
            <>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                Optimization opportunity
              </p>
              <p className="text-3xl font-bold text-white leading-tight">
                You can save{" "}
                <span className="text-green-400">{formatMoney(improvement)}</span>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                By moving from Conservative to{" "}
                <span className="text-indigo-300 font-medium">{bestScenarioName}</span>,
                you reduce your {bestIsRefund ? "tax burden" : "amount due"} by{" "}
                <span className="text-green-400 font-medium">{formatMoney(improvement)}</span>{" "}
                — this year, before you file.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                Current position ({bestScenarioName})
              </p>
              <p className="text-3xl font-bold text-white leading-tight">
                {bestIsRefund
                  ? <><span className="text-green-400">+{formatMoney(bestAmount)}</span> estimated refund</>
                  : <><span className="text-red-400">{formatMoney(Math.abs(bestAmount))}</span> estimated due</>
                }
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Your scenarios are well-optimized. Review recommendations below for any remaining opportunities.
              </p>
            </>
          )}
        </div>

        {/* Column 2: Quick stats */}
        <div className="flex flex-col gap-2 sm:border-l sm:border-gray-800 sm:pl-4">
          <div>
            <p className="text-xs text-gray-500">Effective tax rate</p>
            <p className={clsx("text-xl font-bold tabular-nums", rateColor)}>
              {rateNum.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Audit flags</p>
            <p className={clsx(
              "text-xl font-bold tabular-nums",
              auditFlagsCount === 0 ? "text-green-400" :
              auditFlagsCount <= 2  ? "text-amber-400" : "text-red-400"
            )}>
              {auditFlagsCount === 0 ? "None ✓" : auditFlagsCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Best strategy</p>
            <p className="text-sm font-semibold text-indigo-300">{bestScenarioName}</p>
          </div>
        </div>
      </div>

      {/* Deadline nudge */}
      <div className="mt-4 pt-3 border-t border-gray-800 flex items-center gap-2">
        <span className="text-amber-400 text-sm">⏱</span>
        <p className="text-xs text-gray-500">
          <span className="text-amber-400 font-medium">Before December 31</span> —
          these numbers can change. Expense adjustments, retirement contributions, and
          income timing decisions made now directly affect your {new Date().getFullYear()} return.
        </p>
      </div>
    </div>
  );
}
