"use client";

import { ProductFilters } from "@/lib/types";

interface FiltersProps {
  filters: ProductFilters;
  categories: string[];
  onChange: (filters: ProductFilters) => void;
}

export function Filters({ filters, categories, onChange }: FiltersProps) {
  const inputClass = "w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-base text-zinc-950 shadow-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200";
  const update = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px_auto]">
        <label>
          <span className="mb-1 block text-sm font-bold text-zinc-800">Знайти товар</span>
          <input value={filters.search} onChange={(e) => update("search", e.target.value)} className={inputClass} placeholder="Наприклад: антибіотик, Клавасептин, шприц" />
        </label>
        <label>
          <span className="mb-1 block text-sm font-bold text-zinc-800">Категорія</span>
          <select value={filters.category} onChange={(e) => update("category", e.target.value)} className={inputClass}>
            <option value="">Усі категорії</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="flex cursor-pointer items-end gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-800">
          <input type="checkbox" checked={filters.onlyPriority} onChange={(e) => update("onlyPriority", e.target.checked)} className="h-5 w-5 accent-indigo-600" />
          <span>Тільки наші хіти та акції</span>
        </label>
      </div>
    </section>
  );
}
