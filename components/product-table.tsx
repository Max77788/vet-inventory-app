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
    <div className="mt-2 flex flex-wrap gap-1.5">
      {product.is_own_import && <span className="rounded-full bg-indigo-700 px-2.5 py-1 text-xs font-black text-white">НАШ ІМПОРТ</span>}
      {product.is_featured && <span className="rounded-full bg-amber-300 px-2.5 py-1 text-xs font-black text-amber-950">ХІТ</span>}
      {product.is_promo && <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-black text-white">{product.promo_label || "АКЦІЯ"}</span>}
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">Є на складі Київ</span>
    </div>
  );
}

export function ProductTable({ products, cartQuantities, onAdd }: ProductTableProps) {
  if (!products.length) return <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-lg text-zinc-600">За цим запитом товарів не знайдено.</div>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const quantity = cartQuantities[product.id] ?? 0;
        return <article key={product.id} className={`flex min-h-56 flex-col rounded-2xl border bg-white p-4 shadow-sm ${product.is_own_import || product.is_featured || product.is_promo ? "border-indigo-300 ring-1 ring-indigo-100" : "border-zinc-200"}`}>
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{product.category}</p>
          <h2 className="mt-1 text-lg font-extrabold leading-snug text-zinc-950">{product.name}</h2>
          <ProductBadges product={product} />
          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div><p className="text-xs font-semibold text-zinc-500">Ціна за уп.</p><p className="text-xl font-black text-zinc-950">{formatPrice(product.price)}</p></div>
            <button onClick={() => onAdd(product)} className="rounded-xl bg-indigo-700 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-indigo-800 active:scale-95">
              {quantity ? `Додати ще (${quantity})` : "Додати"}
            </button>
          </div>
        </article>;
      })}
    </div>
  );
}
