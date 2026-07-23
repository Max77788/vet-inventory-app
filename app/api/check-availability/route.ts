import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

function cleanName(raw: string): string {
  return raw
    .replace(/(шт|фл|уп|таб|мл|кг|г|доз|пак|конц|спрей|амп|капс|гран|р-р|сусп|емуль|пор|суп|сироп|крем|мазь|гель)[\s\.\(]*/gi, " ")
    .replace(/[\(\)\[\]\{\}]/g, " ")
    .replace(/\d+[\.\,]?\d*\s*(мл|мг|г|кг|шт|таб|д|уп|%|ед)/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

async function checkHotlineCount(rawName: string): Promise<{ count: number | null; query: string; rawLen: number }> {
  const query = cleanName(rawName);
  const encoded = encodeURIComponent(query);
  const url = `https://hotline.ua/sr/?q=${encoded}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error("Hotline status:", res.status, res.statusText);
      return { count: null, query, rawLen: 0 };
    }
    const html = await res.text();

    const match = html.match(/(\d+)\s*(?:товар|товарів|товари)/);
    if (match) return { count: parseInt(match[1], 10), query, rawLen: html.length };

    const hasTitle = html.includes("За запитом");
    if (hasTitle) return { count: 0, query, rawLen: html.length };

    return { count: null, query, rawLen: html.length };
  } catch (err: any) {
    console.error("Hotline fetch error:", err?.message || err);
    return { count: null, query, rawLen: 0 };
  }
}

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 20) {
    return NextResponse.json(
      { error: "Provide 1-20 product ids" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, barcode")
    .in("id", ids);

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Not found" }, { status: 500 });
  }

  const results: {
    id: number;
    status: string;
    notes: string;
    query: string;
    rawName: string;
  }[] = [];

  for (const product of data) {
    const rawName = String(product.name);
    const { count, query, rawLen } = await checkHotlineCount(rawName);

    if (count === null) {
      results.push({
        id: product.id,
        status: "unknown",
        notes: "Hotline lookup failed",
        query,
        rawName,
      });
    } else if (count > 0) {
      results.push({
        id: product.id,
        status: "available",
        notes: `Hotline found ${count} offer(s)`,
        query,
        rawName,
      });
    } else {
      results.push({
        id: product.id,
        status: "unavailable",
        notes: "No Hotline results",
        query,
        rawName,
      });
    }

    if (data.length > 1) await new Promise((r) => setTimeout(r, 700));
  }

  for (const r of results) {
    await supabase
      .from("products")
      .update({
        availability_status: r.status,
        availability_notes: r.notes,
        availability_source: "hotline.ua",
        availability_checked_at: new Date().toISOString(),
      })
      .eq("id", r.id);
  }

  return NextResponse.json({ checked: results.length, results });
}
