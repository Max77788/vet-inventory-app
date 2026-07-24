"use client";

import { useState } from "react";
import { ProductFilters } from "@/lib/types";

interface FiltersProps {
  filters: ProductFilters;
  gs1Countries: string[];
  onChange: (filters: ProductFilters) => void;
}

export function Filters({ filters, gs1Countries, onChange }: FiltersProps) {
  const [local, setLocal] = useState(filters);

  function update<K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) {
    const next = { ...local, [key]: value };
    setLocal(next);
    onChange(next);
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base font-medium text-zinc-900 shadow-sm " +
    "focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 " +
    "dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-400";

  const labelClass = "mb-1.5 block text-sm font-bold text-zinc-800 dark:text-zinc-200";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className={labelClass}>Search name</label>
          <input
            type="text"
            value={local.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder="e.g. Апоквель"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Origin</label>
          <select
            value={local.origin}
            onChange={(e) => update("origin", e.target.value as ProductFilters["origin"])}
            className={inputClass}
          >
            <option value="all">All</option>
            <option value="Ukraine">Ukraine</option>
            <option value="Abroad">Abroad</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Availability</label>
          <select
            value={local.availability}
            onChange={(e) =>
              update("availability", e.target.value as ProductFilters["availability"])
            }
            className={inputClass}
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="unavailable">Not found</option>
            <option value="unknown">Not checked</option>
            <option value="pending">Checking</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Has barcode</label>
          <select
            value={local.hasBarcode}
            onChange={(e) =>
              update("hasBarcode", e.target.value as ProductFilters["hasBarcode"])
            }
            className={inputClass}
          >
            <option value="all">All</option>
            <option value="yes">With barcode</option>
            <option value="no">Without barcode</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>GS1 country</label>
          <select
            value={local.gs1Country}
            onChange={(e) => update("gs1Country", e.target.value)}
            className={inputClass}
          >
            <option value="">All</option>
            {gs1Countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelClass}>Min UAH</label>
            <input
              type="number"
              value={local.minPrice}
              onChange={(e) => update("minPrice", e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Max UAH</label>
            <input
              type="number"
              value={local.maxPrice}
              onChange={(e) => update("maxPrice", e.target.value)}
              placeholder="∞"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Page size</label>
          <select
            value={local.pageSize}
            onChange={(e) => update("pageSize", Number(e.target.value))}
            className={inputClass}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelClass}>Sort by</label>
            <select
              value={local.sortBy}
              onChange={(e) =>
                update("sortBy", e.target.value as ProductFilters["sortBy"])
              }
              className={inputClass}
            >
              <option value="row_no">Row #</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClass}>Order</label>
            <select
              value={local.sortOrder}
              onChange={(e) =>
                update("sortOrder", e.target.value as ProductFilters["sortOrder"])
              }
              className={inputClass}
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
