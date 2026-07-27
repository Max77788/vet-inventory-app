"use client";

import { createClient } from "@/lib/supabase-client";
import { Product, ProductFilters, QuoteRequestInput } from "@/lib/types";

export async function fetchProducts(
  filters: ProductFilters,
  page: number
): Promise<{ data: Product[]; count: number }> {
  const supabase = createClient();
  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .eq("in_stock", true);

  if (filters.search.trim()) query = query.ilike("name", `%${filters.search.trim()}%`);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.onlyPriority) query = query.or("is_own_import.eq.true,is_featured.eq.true,is_promo.eq.true");

  // Own/imported, featured and promotional items always lead their category/search result.
  query = query
    .order("is_own_import", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("is_promo", { ascending: false })
    .order(filters.sortBy, { ascending: filters.sortOrder === "asc" });

  const from = (page - 1) * filters.pageSize;
  const { data, error, count } = await query.range(from, from + filters.pageSize - 1);
  if (error) throw new Error(error.message);
  return { data: (data as Product[]) ?? [], count: count ?? 0 };
}

export async function fetchCategories(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .eq("is_active", true)
    .eq("in_stock", true);
  if (error) throw new Error(error.message);
  return Array.from(new Set((data ?? []).map((row) => String(row.category)).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, "uk")
  );
}

export async function submitQuoteRequest(input: QuoteRequestInput): Promise<{ requestCode: string }> {
  const res = await fetch("/api/quote-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Не вдалося надіслати заявку");
  return body as { requestCode: string };
}
