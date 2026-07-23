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
  // Insert space before price/date-like numbers that are stuck to text
  let s = raw.replace(/(\D)(\d{1,2}[.,]\d{2})/g, "$1 $2");
  // Split into tokens
  const tokens = s.split(/\s+/);
  const clean: string[] = [];

  for (const tok of tokens) {
    const t = tok.replace(/^[()\[\]{}*,;:.\s]+|[()\[\]{}*,;:.\s]+$/g, "");
    if (!t) continue;

    // Stop on packaging / dosage / expiration tokens
    if (STOP_RE.test(t)) break;

    // Drop isolated unit abbreviations
    if (/^(?:шт|фл|уп|таб|мл|доз)$/i.test(t)) break;

    clean.push(t);
    if (clean.length >= 3) break;
  }

  return clean.join(" ");
}

async function checkHotlineCount(rawName: string): Promise<{ count: number | null; query: string; htmlLen: number }> {
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
      return { count: null, query, htmlLen: 0 };
    }
    const html = await res.text();

    const match = html.match(/(\d+)\s*(?:товар|товарів|товари)/);
    if (match) return { count: parseInt(match[1], 10), query, htmlLen: html.length };

    const hasTitle = html.includes("За запитом");
    if (hasTitle) return { count: 0, query, htmlLen: html.length };

    return { count: null, query, htmlLen: html.length };
  } catch (err: any) {
    console.error("Hotline fetch error:", err?.message || err);
    return { count: null, query, htmlLen: 0 };
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
    const { count, query, htmlLen } = await checkHotlineCount(rawName);

    if (count === null) {
      results.push({
        id: product.id,
        status: "unknown",
        notes: htmlLen > 0 ? "Hotline parse miss" : "Hotline lookup failed",
        query,
      });
    } else if (count > 0) {
      results.push({
        id: product.id,
        status: "available",
        notes: `Hotline found ${count} offer(s)`,
        query,
      });
    } else {
      results.push({
        id: product.id,
        status: "unavailable",
        notes: "No Hotline results",
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
        availability_source: "hotline.ua",
        availability_checked_at: new Date().toISOString(),
      })
      .eq("id", r.id);
  }

  return NextResponse.json({ checked: results.length, results });
}
