import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const MAX_ITEMS = 100;

function database() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customerName = String(body.customerName || "").trim();
    const customerPhone = String(body.customerPhone || "").trim();
    const customerComment = String(body.customerComment || "").trim();
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (customerName.length < 2) return NextResponse.json({ error: "Вкажіть ім’я або назву клініки" }, { status: 400 });
    if (customerPhone.length < 5) return NextResponse.json({ error: "Вкажіть номер телефону для відповіді" }, { status: 400 });
    if (!rawItems.length || rawItems.length > MAX_ITEMS) return NextResponse.json({ error: "Кошик порожній або містить забагато позицій" }, { status: 400 });

    const items: Array<{ product_id: number; quantity: number }> = rawItems.map((item: unknown) => {
      const value = item as { productId?: unknown; quantity?: unknown };
      return { product_id: Number(value.productId), quantity: Number(value.quantity) };
    });
    if (items.some(({ product_id, quantity }) => !Number.isInteger(product_id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 999)) {
      return NextResponse.json({ error: "Перевірте кількість товарів у кошику" }, { status: 400 });
    }

    const requestCode = `VET-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const { error } = await database().rpc("create_quote_request", {
      p_request_code: requestCode,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_customer_comment: customerComment || null,
      p_items: items,
    });
    if (error) {
      console.error("Quote request rejected", error.message);
      return NextResponse.json({ error: "Частина товарів більше недоступна. Оновіть каталог." }, { status: 409 });
    }
    return NextResponse.json({ requestCode });
  } catch (error) {
    console.error("Quote request failure", error);
    return NextResponse.json({ error: "Не вдалося надіслати запит. Спробуйте ще раз." }, { status: 500 });
  }
}
