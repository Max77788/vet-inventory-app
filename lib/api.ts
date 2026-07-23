"use client";

import { createClient } from "@/lib/supabase-client";
import { Product, ProductFilters } from "@/lib/types";

export async function fetchProducts(
  filters: ProductFilters,
  page: number,
  pageSize: number
): Promise<{ data: Product[]; count: number }> {
  const supabase = createClient();

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("row_no", { ascending: true });

  if (filters.search.trim()) {
    query = query.ilike("name", `%${filters.search.trim()}%`);
  }
  if (filters.origin !== "all") {
    query = query.eq("origin", filters.origin);
  }
  if (filters.availability !== "all") {
    query = query.eq("availability_status", filters.availability);
  }
  if (filters.minPrice) {
    query = query.gte("price", parseFloat(filters.minPrice));
  }
  if (filters.maxPrice) {
    query = query.lte("price", parseFloat(filters.maxPrice));
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("fetchProducts error:", error);
    throw new Error(error.message);
  }

  return { data: (data as Product[]) ?? [], count: count ?? 0 };
}

export async function checkAvailabilityAction(ids: number[]): Promise<void> {
  const res = await fetch("/api/check-availability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
}

export async function recountOrigins(): Promise<{
  Ukraine: number;
  Abroad: number;
  Unknown: number;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("origin")
    .not("origin", "is", null);

  if (error) throw new Error(error.message);

  const counts = { Ukraine: 0, Abroad: 0, Unknown: 0 };
  (data as { origin: Product["origin"] }[]).forEach((row) => {
    counts[row.origin] = (counts[row.origin] ?? 0) + 1;
  });
  return counts;
}
