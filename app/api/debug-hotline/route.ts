// Add a simple debug endpoint to echo Hotline result for one query
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "апоквель";
  const url = `https://hotline.ua/sr/?q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const body = await res.text();
    const match = body.match(/(\d+)\s*(?:товар|товарів|товари)/);
    return NextResponse.json({
      status: res.status,
      matchedCount: match ? match[1] : null,
      hasSearchTitle: body.includes("За запитом"),
      len: body.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
