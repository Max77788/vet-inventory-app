"use client";

import { useState } from "react";
import { ProductFilters } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FiltersProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
}

export function Filters({ filters, onChange }: FiltersProps) {
  const [local, setLocal] = useState(filters);

  function update<K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) {
    const next = { ...local, [key]: value };
    setLocal(next);
    onChange(next);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-600">Search name</label>
          <input
            type="text"
            value={local.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder="e.g. Апоквель"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Origin</label>
          <select
            value={local.origin}
            onChange={(e) => update("origin", e.target.value as ProductFilters["origin"])}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="Ukraine">Ukraine</option>
            <option value="Abroad">Abroad</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Availability</label>
          <select
            value={local.availability}
            onChange={(e) =>
              update("availability", e.target.value as ProductFilters["availability"])
            }
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="unavailable">Not found</option>
            <option value="unknown">Not checked</option>
            <option value="pending">Checking</option>
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-600">Min UAH</label>
            <input
              type="number"
              value={local.minPrice}
              onChange={(e) => update("minPrice", e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-600">Max UAH</label>
            <input
              type="number"
              value={local.maxPrice}
              onChange={(e) => update("maxPrice", e.target.value)}
              placeholder="∞"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
