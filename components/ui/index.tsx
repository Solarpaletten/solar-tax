// components/ui/index.tsx
// Re-export formatMoney from single source s
export { formatMoney } from "@/lib/money";

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({
  icon = "📂",
  title,
  description,
}: {
  icon?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-300">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-500 max-w-xs">{description}</p>
      )}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h2>
      {action}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
import { clsx } from "clsx";

export function Badge({
  children,
  variant = "gray",
}: {
  children: React.ReactNode;
  variant?: "green" | "yellow" | "red" | "blue" | "gray" | "amber";
}) {
  return (
    <span className={clsx("badge", `badge-${variant}`)}>{children}</span>
  );
}
