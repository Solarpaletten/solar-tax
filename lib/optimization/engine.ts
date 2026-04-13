// lib/optimization/engine.ts
// Orchestrator — combines score, compare, recommend, actions.
// Single entry point called from the server action.
// Pure function. No DB. No side effects.

import { computeAllScores    } from "./score";
import { selectBestScenario  } from "./compare";
import { generateRecommendations } from "./recommend";
import { generateActionItems } from "./actions";
import type { ScenarioSnapshot, OptimizationResult } from "./types";

export function runOptimizationEngine(
  scenarios: ScenarioSnapshot[]
): OptimizationResult {
  console.log("[OptimizationEngine] START", {
    scenarios: scenarios.map(s => s.type),
  });

  // 1. Score all scenarios
  const scores = computeAllScores(scenarios);

  // 2. Select best scenario
  const best = selectBestScenario(scenarios, scores);

  // 3. Generate recommendations
  const recommendations = generateRecommendations(scenarios);

  // 4. Generate action items
  const actionItems = generateActionItems(scenarios);

  const result: OptimizationResult = {
    best,
    scores,
    recommendations,
    actionItems,
  };

  console.log("[OptimizationEngine] DONE", {
    best:            result.best.type,
    score:           result.best.score,
    recommendations: result.recommendations.length,
    actions:         result.actionItems.length,
  });

  return result;
}

export type { ScenarioSnapshot, OptimizationResult } from "./types";
