"use client";

import { useEffect, useState, useCallback } from "react";
import { Filters } from "@/components/filters";
import { Pagination } from "@/components/pagination";
import { ProductTable } from "@/components/product-table";
import { Product, ProductFilters } from "@/lib/types";
import { fetchProducts, checkAvailabilityAction, recountOrigins } from "@/lib/api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

export default function ProductList() {
  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    origin: "all",
    availability: "all",
    minPrice: "",
    maxPrice: "",
  });
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [originCounts, setOriginCounts] = useState({ Ukraine: 0, Abroad: 0, Unknown: 0 });
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProducts(filters, page, PAGE_SIZE);
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
  }, []);

  useEffect(() => {
    setPage(1);
    setSelected([]);
  }, [filters]);

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

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <button
          onClick={() => filterByOrigin("Ukraine")}
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-left transition hover:bg-emerald-100"
        >
          <div className="text-xs font-medium text-emerald-700">Ukraine origin</div>
          <div className="text-2xl font-bold text-emerald-900">{originCounts.Ukraine}</div>
        </button>
        <button
          onClick={() => filterByOrigin("Abroad")}
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left transition hover:bg-amber-100"
        >
          <div className="text-xs font-medium text-amber-700">Abroad origin</div>
          <div className="text-2xl font-bold text-amber-900">{originCounts.Abroad}</div>
        </button>
        <button
          onClick={() => filterByOrigin("Unknown")}
          className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:bg-zinc-100"
        >
          <div className="text-xs font-medium text-zinc-600">Unknown origin</div>
          <div className="text-2xl font-bold text-zinc-900">{originCounts.Unknown}</div>
        </button>
      </div>

      <Filters filters={filters} onChange={setFilters} />

      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600">
          Showing <span className="font-semibold text-zinc-900">{products.length}</span> of{" "}
          <span className="font-semibold text-zinc-900">{count}</span> products
          {selected.length > 0 && (
            <span className="ml-2">({selected.length} selected)</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            onClick={checkSelected}
            disabled={selected.length === 0 || checking}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium text-white transition",
              selected.length === 0
                ? "cursor-not-allowed bg-zinc-400"
                : "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            {checking ? "Checking online..." : `Check availability (${selected.length})`}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center text-zinc-500">
          Loading...
        </div>
      ) : (
        <ProductTable
          products={products}
          selectedIds={selected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          allSelectedOnPage={selected.length === products.length && products.length > 0}
        />
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
