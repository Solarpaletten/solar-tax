// lib/wizard/nav.ts 
// Navigation engine — pure functions, no side effects. s 

import { STEPS, type WizardStep } from "./steps"

export function getStepIndex(stepId: string): number {
  return STEPS.findIndex((s) => s.id === stepId)
}

export function getStep(stepId: string): WizardStep | undefined {
  return STEPS.find((s) => s.id === stepId)
}

export function nextStep(stepId: string): WizardStep | undefined {
  const i = getStepIndex(stepId)
  if (i === -1 || i >= STEPS.length - 1) return undefined
  return STEPS[i + 1]
}

export function prevStep(stepId: string): WizardStep | undefined {
  const i = getStepIndex(stepId)
  if (i <= 0) return undefined
  return STEPS[i - 1]
}

export function isFirstStep(stepId: string): boolean {
  return getStepIndex(stepId) === 0
}

export function isLastStep(stepId: string): boolean {
  return getStepIndex(stepId) === STEPS.length - 1
}

export function progressPct(stepId: string): number {
  const i = getStepIndex(stepId)
  if (i === -1) return 0
  return Math.round(((i + 1) / STEPS.length) * 100)
}
