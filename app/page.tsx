import ProductList from "@/components/product-list";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <header className="mb-6 overflow-hidden rounded-3xl bg-zinc-950 p-5 text-white shadow-xl sm:p-8">
        <div className="inline-flex rounded-full bg-emerald-400 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-950">Vet catalog · Київський склад</div>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Ветеринарний каталог</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-200">Актуальні ціни, категорії, наш імпорт і акції. Додайте позиції в кошик, а менеджер отримає готову заявку.</p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
          <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">✓ Ціни в каталозі</span>
          <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">✓ Заявка без онлайн-оплати</span>
        </div>
      </header>
      <ProductList />
    </main>
  );
}
