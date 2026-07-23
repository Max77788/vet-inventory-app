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

const STOP_RE = /^\d{1,2}[.,]\d{2}$|^\d+(?:[.,]\d+)?(?:мл|мг|г|кг|шт|таб|капс|доз|амп|фл|уп|%)?$|№|\*|упак|пак|до\s*\d{2}|\d{2}[./]\d{2}/i;

function cleanName(raw: string): string {
  const s = raw.replace(/(\D)(\d{1,2}[.,]\d{2})/g, "$1 $2");
  const tokens = s.split(/\s+/);
  const clean: string[] = [];

  for (const tok of tokens) {
    const t = tok.replace(/^[()\[\]{}*,;:.\s]+|[()\[\]{}*,;:.\s]+$/g, "");
    if (!t) continue;
    if (STOP_RE.test(t)) break;
    if (/^(?:шт|фл|уп|таб|мл|доз)$/i.test(t)) break;
    clean.push(t);
    if (clean.length >= 3) break;
  }

  return clean.join(" ");
}

async function checkRozetkaCount(rawName: string): Promise<{ count: number | null; query: string }> {
  const query = cleanName(rawName);
  const encoded = encodeURIComponent(query);
  const url = `https://search.rozetka.com.ua/search/api/v6/?country=UA&section_id=0&text=${encoded}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error("Rozetka status:", res.status, res.statusText);
      return { count: null, query };
    }

    const json: any = await res.json();
    const count = Number(
      json?.data?.quantities?.goods_quantity_total_found ??
      json?.data?.quantities?.goods_quantity_found ??
      -1
    );

    if (count >= 0) {
      return { count, query };
    }

    return { count: null, query };
  } catch (err: any) {
    console.error("Rozetka fetch error:", err?.message || err);
    return { count: null, query };
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
  }[] = [];

  for (const product of data) {
    const rawName = String(product.name);
    const { count, query } = await checkRozetkaCount(rawName);

    if (count === null) {
      results.push({
        id: product.id,
        status: "unknown",
        notes: "Rozetka lookup failed",
        query,
      });
    } else if (count > 0) {
      results.push({
        id: product.id,
        status: "available",
        notes: `Rozetka found ${count} offer(s)`,
        query,
      });
    } else {
      results.push({
        id: product.id,
        status: "unavailable",
        notes: "No Rozetka results",
        query,
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
        availability_source: "rozetka.com.ua",
        availability_checked_at: new Date().toISOString(),
      })
      .eq("id", r.id);
  }

  return NextResponse.json({ checked: results.length, results });
}
