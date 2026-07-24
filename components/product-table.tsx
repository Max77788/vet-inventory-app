"use client";

import { Product } from "@/lib/types";
import { cn, formatPrice, formatUsd, badgeClass, statusLabel, originLabel } from "@/lib/utils";

interface ProductTableProps {
  products: Product[];
  selectedIds: number[];
  usdRate: number | null;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  allSelectedOnPage: boolean;
}

export function ProductTable({
  products,
  selectedIds,
  usdRate,
  onToggleSelect,
  onToggleSelectAll,
  allSelectedOnPage,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-lg font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        No products match the filters.
      </div>
    );
  }

  const headerClass = "sticky top-0 z-10 bg-zinc-100 px-4 py-3.5 text-sm font-extrabold uppercase tracking-wide text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100";
  const cellClass = "px-4 py-3 align-top";

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-left text-base">
          <thead>
            <tr>
              <th className={`${headerClass} w-12`}>
                <input
                  type="checkbox"
                  checked={allSelectedOnPage}
                  onChange={onToggleSelectAll}
                  className="h-5 w-5 rounded border-zinc-400"
                />
              </th>
              <th className={headerClass}>#</th>
              <th className={`${headerClass} min-w-[340px]`}>Name</th>
              <th className={headerClass}>Barcode</th>
              <th className={headerClass}>Origin</th>
              <th className={headerClass}>GS1 Country</th>
              <th className={headerClass}>Availability</th>
              <th className={`${headerClass} text-right`}>Price UAH</th>
              <th className={`${headerClass} text-right`}>Price USD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {products.map((p) => (
              <tr
                key={p.id}
                className={cn(
                  "transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                  selectedIds.includes(p.id) && "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900"
                )}
              >
                <td className={cellClass}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => onToggleSelect(p.id)}
                    className="h-5 w-5 rounded border-zinc-400"
                  />
                </td>
                <td className={`${cellClass} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>{p.row_no ?? "-"}</td>
                <td className={cellClass}>
                  <div className="font-semibold leading-snug text-zinc-950 dark:text-white break-words">{p.name}</div>
                  {p.availability_notes && (
                    <div className="mt-1 text-sm leading-snug text-zinc-600 dark:text-zinc-400 break-words">
                      {p.availability_notes}
                    </div>
                  )}
                </td>
                <td className={`${cellClass} whitespace-nowrap font-mono text-zinc-700 dark:text-zinc-300`}>{p.barcode ?? "-"}</td>
                <td className={`${cellClass} whitespace-nowrap`}>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap",
                      badgeClass(p.origin)
                    )}
                  >
                    {originLabel(p.origin)}
                  </span>
                </td>
                <td className={`${cellClass} whitespace-nowrap text-zinc-700 dark:text-zinc-300`}>
                  {p.gs1_country_code ?? "-"}
                </td>
                <td className={`${cellClass} whitespace-nowrap`}>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap",
                      badgeClass(p.availability_status)
                    )}
                  >
                    {statusLabel(p.availability_status)}
                  </span>
                </td>
                <td className={`${cellClass} text-right whitespace-nowrap font-bold text-zinc-950 dark:text-white`}>
                  {formatPrice(p.price)}
                </td>
                <td className={`${cellClass} text-right whitespace-nowrap font-bold text-zinc-950 dark:text-white`}>
                  {formatUsd(p.price, usdRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
