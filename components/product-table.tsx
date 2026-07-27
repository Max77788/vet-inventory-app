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
      {product.is_own_import && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black tracking-wide text-amber-950">★ НАШ ЕКСКЛЮЗИВ</span>}
      {product.is_featured && <span className="rounded-full bg-indigo-700 px-2 py-0.5 text-[10px] font-black text-white">ХІТ</span>}
      {product.is_promo && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white">{product.promo_label || "АКЦІЯ"}</span>}
      <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-900">Є на складі · Київ</span>
    </div>
  );
}

export function ProductTable({ products, cartQuantities, onAdd }: ProductTableProps) {
  if (!products.length) return <div className="rounded-2xl border-2 border-zinc-200 bg-white p-10 text-center text-lg font-medium text-zinc-600">За цим запитом товарів не знайдено.</div>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const quantity = cartQuantities[product.id] ?? 0;
        const isPriority = product.is_own_import || product.is_featured || product.is_promo;
        return <article key={product.id} className={`flex min-h-[11rem] flex-col rounded-2xl border-2 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${product.is_own_import ? "border-amber-400 bg-amber-50/40 ring-2 ring-amber-100" : isPriority ? "border-indigo-400 ring-2 ring-indigo-100" : "border-zinc-200 hover:border-zinc-400"}`}>
          <div className="flex min-w-0 gap-3">
            {product.image_url && <img src={product.image_url} alt={`Фото ${product.name}`} className="h-16 w-16 shrink-0 rounded-xl border border-zinc-200 object-cover" loading="lazy" />}
            <div className="min-w-0"><p className="w-fit rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-zinc-700">{product.category}</p>
            <h2 className="mt-2 text-[17px] font-extrabold leading-snug text-zinc-950">{product.name}</h2></div>
          </div>
          <ProductBadges product={product} />
          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <div><p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Ціна за уп.</p><p className="text-xl font-black text-zinc-950">{formatPrice(product.price)}</p></div>
            <button type="button" onClick={() => onAdd(product)} aria-label={`Додати ${product.name} до кошика`} className="rounded-xl bg-indigo-700 px-3 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 active:scale-95">
              {quantity ? `Додати ще (${quantity})` : "Додати"}
            </button>
          </div>
        </article>;
      })}
    </div>
  );
}
