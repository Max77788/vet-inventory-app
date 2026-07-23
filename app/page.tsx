import ProductList from "@/components/product-list";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Vet Inventory Price List
        </h1>
        <p className="mt-2 text-zinc-600">
          Прайс-лист 16.07.26 with barcode origin and Ukraine availability checks.
        </p>
      </div>
      <ProductList />
    </main>
  );
}
