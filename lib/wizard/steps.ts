// lib/wizard/steps.ts s
export type WizardStep = {
  id: string
  title: string
  shortTitle: string
  path: (taxYearId: string) => string
  irsForm?: string
}

export const STEPS: WizardStep[] = [
  { id: "sign",       title: "Sign Form 8879",                    shortTitle: "Sign",    irsForm: "8879",        path: (id) => `/tax-year/${id}/wizard/sign` },
  { id: "form1040",   title: "Form 1040",                         shortTitle: "1040",    irsForm: "1040",        path: (id) => `/tax-year/${id}/wizard/form1040` },
  { id: "schedule1",  title: "Schedule 1 — Additional Income",    shortTitle: "Sch 1",   irsForm: "Schedule 1",  path: (id) => `/tax-year/${id}/wizard/schedule1` },
  { id: "schedule2",  title: "Schedule 2 — Additional Taxes",     shortTitle: "Sch 2",   irsForm: "Schedule 2",  path: (id) => `/tax-year/${id}/wizard/schedule2` },
  { id: "scheduleC",  title: "Schedule C — Business Income",      shortTitle: "Sch C",   irsForm: "Schedule C",  path: (id) => `/tax-year/${id}/wizard/scheduleC` },
  { id: "scheduleD",  title: "Schedule D — Capital Gains",        shortTitle: "Sch D",   irsForm: "Schedule D",  path: (id) => `/tax-year/${id}/wizard/scheduleD` },
  { id: "scheduleSE", title: "Schedule SE — Self-Employment Tax", shortTitle: "SE",      irsForm: "Schedule SE", path: (id) => `/tax-year/${id}/wizard/scheduleSE` },
  { id: "form8949",   title: "Form 8949 — Capital Asset Sales",   shortTitle: "8949",    irsForm: "Form 8949",   path: (id) => `/tax-year/${id}/wizard/form8949` },
  { id: "form8995",   title: "Form 8995 — QBI Deduction",         shortTitle: "8995",    irsForm: "Form 8995",   path: (id) => `/tax-year/${id}/wizard/form8995` },
  { id: "form8829",   title: "Form 8829 — Home Office",           shortTitle: "8829",    irsForm: "Form 8829",   path: (id) => `/tax-year/${id}/wizard/form8829` },
  { id: "review",     title: "Review & Submit",                   shortTitle: "Review",                           path: (id) => `/tax-year/${id}/wizard/review` },
]

export const STEP_IDS = STEPS.map((s) => s.id)
