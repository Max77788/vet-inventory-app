"use client";

import { ProductFilters } from "@/lib/types";

interface FiltersProps {
  filters: ProductFilters;
  categories: string[];
  onChange: (filters: ProductFilters) => void;
}

export function Filters({ filters, categories, onChange }: FiltersProps) {
  const inputClass = "w-full rounded-xl border-2 border-zinc-300 bg-white px-3 py-3 text-base font-medium text-zinc-950 shadow-sm outline-none transition focus:border-indigo-700 focus:ring-4 focus:ring-indigo-100";
  const update = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <section aria-label="Пошук і фільтри каталогу" className="rounded-2xl border-2 border-zinc-200 bg-white p-4 shadow-md sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-lg font-black text-zinc-950">Знайдіть потрібний товар</h2><p className="text-sm font-medium text-zinc-600">Використайте назву, категорію або добірку пріоритетних позицій.</p></div>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-800">Пошук у каталозі</span>
      </div>
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
        <label className="flex min-h-13 cursor-pointer items-center gap-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-black text-indigo-950 transition hover:border-indigo-400">
          <input type="checkbox" checked={filters.onlyPriority} onChange={(e) => update("onlyPriority", e.target.checked)} className="h-5 w-5 accent-indigo-600" />
          <span>Тільки наші хіти та акції</span>
        </label>
      </div>
    </section>
  );
}
