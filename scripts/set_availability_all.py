import os, re, time, json
from datetime import datetime, timezone
from urllib.parse import quote
import requests
import psycopg2
from dotenv import load_dotenv

load_dotenv('/home/max/vet-inventory-app/.env.local')

DB_HOST = 'db.phgogybfgovrlcdmifpv.supabase.co'
DB_NAME = 'postgres'
DB_USER = 'postgres'
DB_PASSWORD = 'NsHd9sN7FnP3Tpae'

STOP_RE = re.compile(
    r"^\d{1,2}[.,]\d{2}$|^\d+(?:[.,]\d+)?(?:мл|мг|г|кг|шт|таб|капс|доз|амп|фл|уп|%)?$|No|\*|упак|пак|до\s*\d{2}|\d{2}[./]\d{2}",
    re.IGNORECASE,
)


def clean_name(raw: str) -> str:
    s = re.sub(r"(\D)(\d{1,2}[.,]\d{2})", r"\1 \2", raw)
    tokens = s.split()
    clean = []
    for tok in tokens:
        t = re.sub(r"^[()\[\]{}*,;:.\s]+|[()\[\]{}*,;:.\s]+$", "", tok)
        if not t:
            continue
        if STOP_RE.search(t):
            break
        if re.search(r"^(?:шт|фл|уп|таб|мл|доз)$", t, re.IGNORECASE):
            break
        clean.append(t)
        if len(clean) >= 3:
            break
    return " ".join(clean)


def check_rozetka(raw_name: str):
    query = clean_name(raw_name)
    encoded = quote(query)
    url = f"https://search.rozetka.com.ua/search/api/v6/?country=UA&section_id=0&text={encoded}"
    try:
        r = requests.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
                "Accept": "application/json",
            },
            timeout=10,
        )
        if not r.ok:
            return None, query
        data = r.json()
        count = int(
            data.get("data", {}).get("quantities", {}).get("goods_quantity_total_found")
            or data.get("data", {}).get("quantities", {}).get("goods_quantity_found")
            or -1
        )
        return count if count >= 0 else None, query
    except Exception as e:
        print("Rozetka error:", e)
        return None, query


def main():
    conn = psycopg2.connect(
        host=DB_HOST, port=5432, database=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM vet_inventory_app.products ORDER BY id")
    rows = cur.fetchall()
    print(f"Checking {len(rows)} products...")

    checked = 0
    updated = 0
    for idx, (pid, name) in enumerate(rows, start=1):
        query = ""
        try:
            count, query = check_rozetka(name)
        except Exception as exc:
            print(f"[{idx}] error on {name}: {exc}")
            count = None
        now = datetime.now(timezone.utc).isoformat()
        if count is None:
            status = "unknown"
            notes = "Rozetka lookup failed"
        elif count > 0:
            status = "available"
            notes = f"Rozetka found {count} offer(s) for '{query}'"
        else:
            status = "unavailable"
            notes = f"No Rozetka results for '{query}'"

        cur.execute(
            """
            UPDATE vet_inventory_app.products
            SET availability_status = %s,
                availability_notes = %s,
                availability_source = 'rozetka.com.ua',
                availability_checked_at = %s
            WHERE id = %s
            """,
            (status, notes, now, pid),
        )
        updated += 1
        checked += 1
        if idx % 25 == 0:
            conn.commit()
            print(f"  ...{idx}/{len(rows)} checked")
        time.sleep(0.7)

    conn.commit()
    conn.close()
    print(f"Done. Checked {checked}, updated {updated}.")


if __name__ == "__main__":
    main()
