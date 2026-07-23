"use client";

import { Product, ProductFilters } from "@/lib/types";
import { cn, formatPrice, badgeClass, statusLabel, originLabel } from "@/lib/utils";

interface ProductTableProps {
  products: Product[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  allSelectedOnPage: boolean;
}

export function ProductTable({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelectedOnPage,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
        No products match the filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-700">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelectedOnPage}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-zinc-300"
              />
            </th>
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Barcode</th>
            <th className="px-4 py-3 font-semibold">Origin</th>
            <th className="px-4 py-3 font-semibold">GS1 Country</th>
            <th className="px-4 py-3 font-semibold">Availability</th>
            <th className="px-4 py-3 font-semibold text-right">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {products.map((p) => (
            <tr key={p.id} className={cn(selectedIds.includes(p.id) && "bg-blue-50")}>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(p.id)}
                  onChange={() => onToggleSelect(p.id)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
              </td>
              <td className="px-4 py-3 text-zinc-500">{p.row_no ?? "-"}</td>
              <td className="px-4 py-3 max-w-md">
                <div className="font-medium text-zinc-900">{p.name}</div>
                {p.availability_notes && (
                  <div className="mt-1 text-xs text-zinc-500">
                    {p.availability_notes}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-zinc-600">{p.barcode ?? "-"}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                    badgeClass(p.origin)
                  )}
                >
                  {originLabel(p.origin)}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {p.gs1_country_code ?? "-"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                    badgeClass(p.availability_status)
                  )}
                >
                  {statusLabel(p.availability_status)}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-medium text-zinc-900">
                {formatPrice(p.price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
