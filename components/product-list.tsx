"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CartDrawer } from "@/components/cart-drawer";
import { Filters } from "@/components/filters";
import { Pagination } from "@/components/pagination";
import { ProductTable } from "@/components/product-table";
import { fetchCategories, fetchProducts, submitQuoteRequest } from "@/lib/api";
import { CartItem, Product, ProductFilters } from "@/lib/types";

const CART_KEY = "vet-catalog-cart-v1";
const initialFilters: ProductFilters = { search: "", category: "", onlyPriority: false, pageSize: 24, sortBy: "name", sortOrder: "asc" };

export default function ProductList() {
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const result = await fetchProducts(filters, page); setProducts(result.data); setCount(result.count); }
    catch (err) { setError(err instanceof Error ? err.message : "Не вдалося завантажити каталог"); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchCategories().then(setCategories).catch(() => setCategories([])); }, []);
  useEffect(() => { try { const saved = localStorage.getItem(CART_KEY); if (saved) setCart(JSON.parse(saved)); } catch {} }, []);
  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { setPage(1); }, [filters]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const quantities = useMemo(() => Object.fromEntries(cartItems.map(({ product, quantity }) => [product.id, quantity])), [cartItems]);
  const add = (product: Product) => setCart((current) => ({ ...current, [product.id]: { product, quantity: (current[product.id]?.quantity || 0) + 1 } }));
  const changeQuantity = (id: number, quantity: number) => setCart((current) => {
    if (quantity <= 0) { const { [id]: _, ...rest } = current; return rest; }
    return { ...current, [id]: { ...current[id], quantity } };
  });
  const sendQuote = async (details: { customerName: string; customerPhone: string; customerComment: string }) => {
    const result = await submitQuoteRequest({ ...details, items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })) });
    setCart({});
    return result.requestCode;
  };
  const totalPages = Math.max(1, Math.ceil(count / filters.pageSize));

  return <div className="space-y-5 pb-24">
    <Filters filters={filters} categories={categories} onChange={setFilters} />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-4">
      <p aria-live="polite" className="text-base font-semibold text-zinc-700">Знайдено <strong className="rounded-md bg-zinc-950 px-2 py-1 text-lg text-white">{count}</strong> товарів <span className="hidden sm:inline">· Наш імпорт, хіти й акції показані першими.</span></p>
      <button type="button" onClick={load} className="rounded-xl border-2 border-zinc-400 bg-white px-4 py-2 font-black text-zinc-900 shadow-sm transition hover:border-zinc-950 hover:bg-zinc-950 hover:text-white focus:outline-none focus:ring-4 focus:ring-zinc-300">Оновити каталог</button>
    </div>
    {error && <div role="alert" className="rounded-xl border-2 border-rose-300 bg-rose-50 p-4 font-semibold text-rose-800">{error}</div>}
    {loading ? <div className="rounded-2xl border-2 border-zinc-200 bg-white p-12 text-center font-bold text-zinc-600">Завантажуємо каталог...</div> : <ProductTable products={products} cartQuantities={quantities} onAdd={add} />}
    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    <CartDrawer items={cartItems} onChangeQuantity={changeQuantity} onSubmit={sendQuote} />
  </div>;
}
