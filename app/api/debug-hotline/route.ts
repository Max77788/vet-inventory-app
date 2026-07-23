import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "апоквель";
  const encoded = encodeURIComponent(q);
  const url = `https://search.rozetka.com.ua/search/api/v6/?country=UA&section_id=0&text=${encoded}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
        Accept: "application/json",
      },
    });
    const json = await res.json();
    const count =
      json?.data?.quantities?.goods_quantity_total_found ??
      json?.data?.quantities?.goods_quantity_found ??
      null;

    return NextResponse.json({
      query: q,
      status: res.status,
      count,
      sample: JSON.stringify(json).slice(0, 200),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
