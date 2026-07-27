"use client";

import { FormEvent, useState } from "react";
import { CartItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface CartDrawerProps {
  items: CartItem[];
  onChangeQuantity: (id: number, quantity: number) => void;
  onSubmit: (details: { customerName: string; customerPhone: string; customerComment: string }) => Promise<string>;
}

export function CartDrawer({ items, onChangeQuantity, onSubmit }: CartDrawerProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerComment: "" });
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + (Number(item.product.price) || 0) * item.quantity, 0);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true); setMessage("");
    try {
      const code = await onSubmit(form);
      setMessage(`Заявку ${code} надіслано менеджеру. Ми зв’яжемося з вами для підтвердження.`);
      setForm({ customerName: "", customerPhone: "", customerComment: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося надіслати заявку");
    } finally { setSubmitting(false); }
  }

  return <>
    <button onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-30 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-xl transition hover:bg-emerald-700 sm:bottom-6 sm:right-6">
      Кошик {quantity ? `· ${quantity}` : ""}
    </button>
    {open && <div className="fixed inset-0 z-40 bg-zinc-950/40" onClick={() => setOpen(false)}>
      <aside onClick={(e) => e.stopPropagation()} className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 p-5"><div><h2 className="text-2xl font-black">Ваш кошик</h2><p className="text-sm text-zinc-600">Це заявка, не онлайн-оплата.</p></div><button onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-bold hover:bg-zinc-100">Закрити</button></div>
        <div className="flex-1 overflow-y-auto p-5">
          {!items.length ? <p className="rounded-xl bg-zinc-100 p-5 text-zinc-600">Додайте товари з каталогу, щоб сформувати заявку.</p> : <div className="space-y-3">{items.map(({ product, quantity: itemQuantity }) => <div key={product.id} className="rounded-xl border border-zinc-200 p-3"><div className="flex justify-between gap-3"><p className="font-bold text-zinc-950">{product.name}</p><p className="whitespace-nowrap font-black">{formatPrice((Number(product.price) || 0) * itemQuantity)}</p></div><div className="mt-3 flex items-center gap-2"><button onClick={() => onChangeQuantity(product.id, itemQuantity - 1)} className="h-9 w-9 rounded-lg border font-black">−</button><span className="w-7 text-center font-black">{itemQuantity}</span><button onClick={() => onChangeQuantity(product.id, itemQuantity + 1)} className="h-9 w-9 rounded-lg border font-black">+</button><span className="ml-auto text-sm text-zinc-500">{formatPrice(product.price)} / уп.</span></div></div>)}</div>}
        </div>
        {!!items.length && <form onSubmit={submit} className="border-t border-zinc-200 p-5"><div className="mb-4 flex items-center justify-between text-lg"><span className="font-bold">Разом</span><strong>{formatPrice(total)}</strong></div><div className="grid gap-3"><input required value={form.customerName} onChange={(e) => setForm({...form, customerName:e.target.value})} placeholder="Ваше ім’я або назва клініки *" className="rounded-xl border p-3"/><input value={form.customerPhone} onChange={(e) => setForm({...form, customerPhone:e.target.value})} placeholder="Телефон для зв’язку" className="rounded-xl border p-3"/><textarea value={form.customerComment} onChange={(e) => setForm({...form, customerComment:e.target.value})} placeholder="Коментар до замовлення" className="rounded-xl border p-3" rows={2}/><button disabled={submitting} className="rounded-xl bg-indigo-700 p-4 font-black text-white disabled:opacity-60">{submitting ? "Надсилаємо..." : "Надіслати заявку менеджеру"}</button>{message && <p className="text-sm font-semibold text-emerald-700">{message}</p>}</div></form>}
      </aside>
    </div>}
  </>;
}
