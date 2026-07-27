import ProductList from "@/components/product-list";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <header className="mb-5 rounded-2xl bg-zinc-950 p-5 text-white shadow-lg sm:p-7">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-300">Vet catalog · Київський склад</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Ветеринарний каталог</h1>
        <p className="mt-2 max-w-2xl text-zinc-300">Актуальні ціни, категорії, наш імпорт і акції. Додайте позиції в кошик, а менеджер отримає готову заявку.</p>
      </header>
      <ProductList />
    </main>
  );
}
