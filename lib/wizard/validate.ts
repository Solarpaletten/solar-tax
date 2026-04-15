// lib/wizard/validate.ts — Phase 2 patch: stronger validation s

export function validateStep(step: string, data: any): string | null {
  if (step === "sign"      && !data?.signed8879) return "sign"
  if (step === "form1040"  && !data?.hasIncome)  return "form1040"
  if (step === "schedule1" && !data?.hasIncome)  return "schedule1"
  return null
}

export function firstErrorStep(data: Record<string, unknown>): string | null {
  if (!data.signed8879) return "sign"
  if (!data.hasIncome)  return "form1040"
  return null
}
