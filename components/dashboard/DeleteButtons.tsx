// components/dashboard/DeleteButtons.tsx
"use client";

import { useRouter } from "next/navigation";
import { deleteTaxYear } from "@/actions/tax-year";
import { deleteHousehold } from "@/actions/household";

export function DeleteTaxYearButton({ id, householdId }: { id: string; householdId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this tax year? All scenarios and data will be lost.")) return;
    await deleteTaxYear(id, householdId);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-red-500 hover:text-red-400 hover:bg-red-950/30 px-2 py-1 rounded transition-colors"
      title="Delete tax year"
    >
      Delete
    </button>
  );
}

export function DeleteHouseholdButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this household and ALL its data? This cannot be undone.")) return;
    await deleteHousehold(id);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-red-500 hover:text-red-400 hover:bg-red-950/30 px-2 py-1 rounded transition-colors"
      title="Delete household"
    >
      Delete
    </button>
  );
}
