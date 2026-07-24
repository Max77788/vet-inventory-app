"use client";

import { useEffect, useState, useCallback } from "react";
import { Filters } from "@/components/filters";
import { Pagination } from "@/components/pagination";
import { ProductTable } from "@/components/product-table";
import { Product, ProductFilters } from "@/lib/types";
import {
  fetchProducts,
  fetchGs1Countries,
  fetchUsdRate,
  checkAvailabilityAction,
  recountOrigins,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ProductList() {
  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    origin: "all",
    availability: "all",
    minPrice: "",
    maxPrice: "",
    hasBarcode: "all",
    gs1Country: "",
    pageSize: 50,
    sortBy: "row_no",
    sortOrder: "asc",
  });
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [originCounts, setOriginCounts] = useState({ Ukraine: 0, Abroad: 0, Unknown: 0 });
  const [gs1Countries, setGs1Countries] = useState<string[]>([]);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProducts(filters, page);
      setProducts(result.data);
      setCount(result.count);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    recountOrigins().then(setOriginCounts).catch(console.error);
    fetchGs1Countries().then(setGs1Countries).catch(console.error);
    fetchUsdRate()
      .then((rate) => {
        setUsdRate(rate);
        setRateError(null);
      })
      .catch((err) => setRateError(err.message || "Could not load USD rate"));
  }, []);

  useEffect(() => {
    setPage(1);
    setSelected([]);
  }, [filters]);

  function updateFilters(next: ProductFilters) {
    setFilters(next);
  }

  function toggleSelect(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    const pageIds = products.map((p) => p.id);
    if (selected.length === pageIds.length) {
      setSelected([]);
    } else {
      setSelected(pageIds);
    }
  }

  async function checkSelected() {
    if (selected.length === 0) return;
    setChecking(true);
    setError(null);
    try {
      await checkAvailabilityAction(selected);
      await load();
      setSelected([]);
    } catch (err: any) {
      setError(err.message || "Availability check failed");
    } finally {
      setChecking(false);
    }
  }

  function filterByOrigin(origin: ProductFilters["origin"]) {
    setFilters((f) => ({ ...f, origin }));
  }

  const totalPages = Math.ceil(count / filters.pageSize);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => filterByOrigin("Ukraine")}
          className="rounded-xl border border-emerald-300 bg-emerald-100 p-5 text-left shadow-sm transition hover:bg-emerald-200 active:bg-emerald-300 dark:border-emerald-700 dark:bg-emerald-900 dark:hover:bg-emerald-800"
        >
          <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Ukraine origin</div>
          <div className="mt-1 text-4xl font-black text-emerald-950 dark:text-emerald-50">{originCounts.Ukraine}</div>
        </button>
        <button
          onClick={() => filterByOrigin("Abroad")}
          className="rounded-xl border border-amber-300 bg-amber-100 p-5 text-left shadow-sm transition hover:bg-amber-200 active:bg-amber-300 dark:border-amber-700 dark:bg-amber-900 dark:hover:bg-amber-800"
        >
          <div className="text-sm font-bold text-amber-900 dark:text-amber-200">Abroad origin</div>
          <div className="mt-1 text-4xl font-black text-amber-950 dark:text-amber-50">{originCounts.Abroad}</div>
        </button>
        <button
          onClick={() => filterByOrigin("Unknown")}
          className="rounded-xl border border-zinc-300 bg-zinc-100 p-5 text-left shadow-sm transition hover:bg-zinc-200 active:bg-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Unknown origin</div>
          <div className="mt-1 text-4xl font-black text-zinc-950 dark:text-zinc-50">{originCounts.Unknown}</div>
        </button>
      </div>

      <Filters filters={filters} gs1Countries={gs1Countries} onChange={updateFilters} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-base font-medium text-zinc-700 dark:text-zinc-300">
          Showing <span className="font-bold text-zinc-950 dark:text-white">{products.length}</span> of{" "}
          <span className="font-bold text-zinc-950 dark:text-white">{count}</span> products
          {selected.length > 0 && (
            <span className="ml-2">({selected.length} selected)</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {rateError ? (
            <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">{rateError}</span>
          ) : usdRate ? (
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              1 USD = <span className="font-bold text-zinc-950 dark:text-white">{usdRate.toFixed(2)} UAH</span>
            </span>
          ) : null}
          <div className="flex gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-base font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Refresh
            </button>
            <button
              onClick={checkSelected}
              disabled={selected.length === 0 || checking}
              className={cn(
                "rounded-md px-4 py-2.5 text-base font-semibold text-white shadow-sm transition",
                selected.length === 0
                  ? "cursor-not-allowed bg-zinc-400"
                  : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
              )}
            >
              {checking ? "Checking online..." : `Check availability (${selected.length})`}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-base font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center text-lg font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          Loading...
        </div>
      ) : (
        <ProductTable
          products={products}
          selectedIds={selected}
          usdRate={usdRate}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          allSelectedOnPage={selected.length === products.length && products.length > 0}
        />
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
