// app/tax-year/layout.tsx
// Shared layout for all /tax-year/* pages — adds AppShell nav.
import { AppShell } from "@/components/layout/AppShell";

export default function TaxYearLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
