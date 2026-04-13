// lib/optimization/types.ts  v2
// Patch: RecommendationType, why/whatChanges/impactEstimate, suggestedChange guard,
//        scoreBreakdown, conflict resolution types.
// All logic remains deterministic, rule-based, no LLM.

export type ScenarioType       = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
export type Priority           = "HIGH" | "MEDIUM" | "LOW";
export type ImpactArea         = "REFUND" | "RISK" | "PROFIT" | "CREDITS" | "WITHHOLDING";
export type RecommendationType = "HARD_RISK" | "OPTIMIZATION" | "INFO";

// suggestedChange: ONLY expense businessPct. No income, no dependents, no filing status.
export interface SuggestedChange {
  expenseId:      string;
  newBusinessPct: number;   // 0–100
  currentPct:     number;
}

export interface Recommendation {
  code:           string;
  type:           RecommendationType;
  title:          string;
  explanation:    string;   // full contextual description
  why:            string;   // one sentence: why this rule fired
  whatChanges:    string;   // one sentence: what the user should do
  impactEstimate: string;   // "$X" or qualitative
  priority:       Priority;
  impact:         ImpactArea;
  scenarioType:   ScenarioType | "ALL";
  suggestedChange?: SuggestedChange;
}

export interface ScenarioSnapshot {
  type:             ScenarioType;
  name:             string;
  grossIncome:      string;
  allowedExpenses:  string;
  netProfit:        string;
  seTax:            string;
  agi:              string;
  taxableIncome:    string;
  totalCredits:     string;
  totalTax:         string;
  refundAmount:     string;
  amountDue:        string;
  effectiveRate:    string;
  criticalFlags:    number;
  warningFlags:     number;
  infoFlags:        number;
  expenseItems:     ExpenseItemSnapshot[];
  totalWithholding: string;
  grossSE:          string;
}

export interface ExpenseItemSnapshot {
  id:          string;
  category:    string;
  amount:      string;
  businessPct: number;
}

// scoreBreakdown is required — UI uses it to explain WHY a scenario scores higher
export interface OptimizationScore {
  scenarioType:   ScenarioType;
  scoreBreakdown: {
    taxEfficiency:     number;   // weight 0.35
    profitQuality:     number;   // weight 0.20
    auditSafety:       number;   // weight 0.30
    creditUtilization: number;   // weight 0.15
  };
  total:  number;
  label:  "Optimal" | "Good" | "Moderate" | "Risky";
}

export interface BestScenario {
  type:          ScenarioType;
  name:          string;
  reason:        string;
  tradeoff:      string;
  refundAmount:  string;
  amountDue:     string;
  score:         number;
  changedFrom?:  ScenarioType;
}

export interface ActionItem {
  code:        string;
  label:       string;
  description: string;
  priority:    Priority;
  done:        boolean;
}

export interface OptimizationResult {
  best:            BestScenario;
  scores:          OptimizationScore[];
  recommendations: Recommendation[];
  actionItems:     ActionItem[];
}
