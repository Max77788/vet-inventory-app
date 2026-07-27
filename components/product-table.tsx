"use client";

import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface ProductTableProps {
  products: Product[];
  cartQuantities: Record<number, number>;
  onAdd: (product: Product) => void;
}

function ProductBadges({ product }: { product: Product }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {product.is_own_import && <span className="rounded-full bg-indigo-700 px-2.5 py-1 text-xs font-black text-white">НАШ ІМПОРТ</span>}
      {product.is_featured && <span className="rounded-full bg-amber-300 px-2.5 py-1 text-xs font-black text-amber-950">ХІТ</span>}
      {product.is_promo && <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-black text-white">{product.promo_label || "АКЦІЯ"}</span>}
      <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-900">Є на складі · Київ</span>
    </div>
  );
}

export function ProductTable({ products, cartQuantities, onAdd }: ProductTableProps) {
  if (!products.length) return <div className="rounded-2xl border-2 border-zinc-200 bg-white p-10 text-center text-lg font-medium text-zinc-600">За цим запитом товарів не знайдено.</div>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const quantity = cartQuantities[product.id] ?? 0;
        return <article key={product.id} className={`flex min-h-60 flex-col rounded-2xl border-2 bg-white p-4 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-xl ${product.is_own_import || product.is_featured || product.is_promo ? "border-indigo-400 ring-2 ring-indigo-100" : "border-zinc-200 hover:border-zinc-400"}`}>
          <p className="w-fit rounded-md bg-zinc-100 px-2 py-1 text-xs font-black uppercase tracking-wide text-zinc-700">{product.category}</p>
          <h2 className="mt-3 text-xl font-extrabold leading-snug text-zinc-950">{product.name}</h2>
          <ProductBadges product={product} />
          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div><p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Ціна за уп.</p><p className="text-2xl font-black text-zinc-950">{formatPrice(product.price)}</p></div>
            <button type="button" onClick={() => onAdd(product)} aria-label={`Додати ${product.name} до кошика`} className="rounded-xl bg-indigo-700 px-4 py-3 text-sm font-black text-white shadow-md transition hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 active:scale-95">
              {quantity ? `Додати ще (${quantity})` : "Додати"}
            </button>
          </div>
        </article>;
      })}
    </div>
  );
}
