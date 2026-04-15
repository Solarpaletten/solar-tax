// lib/reporting/types.ts
// IRS 1040 report types — deterministic, no AI

export type IRS1040Report = {
  // Header
  taxYear:       number;
  filingStatus:  string;
  taxpayerName:  string;
  spouseName?:   string;
  address?:      string;

  // Page 1 — Income
  line1a?:  string;   // W-2 wages
  line7?:   string;   // Capital gain
  line8?:   string;   // Additional income (Schedule 1 / SE)
  line9?:   string;   // Total income
  line10?:  string;   // Adjustments (deductible SE half)
  line11?:  string;   // AGI
  line12?:  string;   // Standard deduction
  line13?:  string;   // QBI deduction
  line14?:  string;   // Total deductions
  line15?:  string;   // Taxable income

  // Page 2 — Tax & Credits
  line16?:  string;   // Income tax
  line17?:  string;   // Schedule 2 line 3
  line18?:  string;   // Add 16+17
  line19?:  string;   // Child tax credit
  line20?:  string;   // Schedule 3 line 8
  line21?:  string;   // Add 19+20
  line22?:  string;   // Tax after credits
  line23?:  string;   // SE tax (other taxes)
  line24?:  string;   // Total tax

  // Payments
  line25a?: string;   // W-2 withholding
  line25b?: string;   // 1099 withholding
  line25d?: string;   // Total withholding
  line26?:  string;   // Estimated payments
  line32?:  string;   // Other refundable credits
  line33?:  string;   // Total payments

  // Refund / Owe
  line34?:  string;   // Overpayment (= refund)
  line35a?: string;   // Refund
  line36?:  string;   // Applied to next year
  line37?:  string;   // Amount owed

  // Meta
  generatedAt:  string;
  scenarioUsed: string;
  notes?:       string[];

  // Source breakdown
  incomeItems:   ReportIncomeItem[];
  expenseItems:  ReportExpenseItem[];
  dependents:    ReportDependent[];
};

export type ReportIncomeItem = {
  type:        string;
  source:      string;
  amount:      string;
  withholding: string;
};

export type ReportExpenseItem = {
  category:    string;
  description: string;
  amount:      string;
  businessPct: number;
  allowed:     string;
};

export type ReportDependent = {
  firstName:    string;
  lastName:     string;
  relationship: string;
  months:       number;
};
