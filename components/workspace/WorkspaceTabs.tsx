// components/workspace/WorkspaceTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export function WorkspaceTabs({ taxYearId }: { taxYearId: string }) {
  const pathname = usePathname();

  const tabs = [
    { label: "Inputs",      href: `/tax-year/${taxYearId}` },
    { label: "Scenarios ⚡", href: `/tax-year/${taxYearId}/scenarios` },
    { label: "Audit Risk",  href: `/tax-year/${taxYearId}/flags` },
    { label: "Optimize ✦",  href: `/tax-year/${taxYearId}/optimize` },
    { label: "IRS Report 📄", href: `/tax-year/${taxYearId}/report` },
  ];

  return (
    <div className="flex gap-0.5 border-b border-gray-800 mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
              active
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-gray-500 hover:text-gray-300"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
