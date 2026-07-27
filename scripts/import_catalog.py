#!/usr/bin/env python3
"""Replace the supplier catalog from an XLSX and preserve merchandising metadata.

Usage:
  DATABASE_URL='postgresql://...' python scripts/import_catalog.py /path/to/price.xlsx \
    --metadata catalog_metadata.csv

The supplier file must contain No, Barcode, Name and Price columns (header may be
anywhere in the first 10 rows). Metadata is optional and has columns:
barcode,name,category,is_own_import,is_featured,is_promo,promo_label,in_stock
Use barcode when possible. A matching name is accepted as a fallback.
"""
import argparse, csv, os, re
from pathlib import Path
import openpyxl
import psycopg2
from psycopg2.extras import execute_values
from barcode_origin import classify_origin

CATEGORY_RULES = [
    ("Антибіотики", ("антибі", "амокси", "клава", "цеф", "енрофло", "докси", "марбо")),
    ("Протипаразитарні", ("блох", "кліщ", "глист", "паразит", "іверм", "селамект", "мільбем")),
    ("Вакцини", ("вакцин", "nobivac", "eurican", "biocan")),
    ("Знеболювальні та протизапальні", ("мелокс", "карпроф", "кетопроф", "знебол")),
    ("Вітаміни та добавки", ("вітам", "омега", "кальц", "пробіот", "добавк")),
    ("Догляд та гігієна", ("шампун", "сервет", "пелюш", "гігієн", "лосьйон")),
    ("Витратні матеріали", ("шприц", "голк", "катетер", "бинт", "рукавич", "систем")),
]

def infer_category(name: str) -> str:
    lowered = name.lower()
    for category, words in CATEGORY_RULES:
        if any(word in lowered for word in words): return category
    return "Інше"

def as_bool(value: str | None) -> bool | None:
    if value is None or not value.strip(): return None
    return value.strip().lower() in {"1", "true", "yes", "так", "y"}

def parse_catalog(path: Path):
    workbook = openpyxl.load_workbook(path, data_only=True, read_only=True)
    sheet = workbook.active
    rows = list(sheet.iter_rows(values_only=True))
    header_index = next((i for i, row in enumerate(rows[:10]) if row and any(str(cell).strip().lower() in {"name", "назва"} for cell in row if cell is not None)), None)
    if header_index is None: raise ValueError("Could not find a Name/Назва column in the first 10 rows")
    headers = {str(cell).strip().lower(): index for index, cell in enumerate(rows[header_index]) if cell is not None}
    name_i = next((headers[key] for key in ("name", "назва") if key in headers), None)
    barcode_i = next((headers[key] for key in ("barcode", "штрихкод", "ean") if key in headers), None)
    price_i = next((headers[key] for key in ("price", "ціна") if key in headers), None)
    no_i = next((headers[key] for key in ("no", "№", "номер") if key in headers), None)
    if name_i is None: raise ValueError("Name column is required")
    products = []
    for row_number, row in enumerate(rows[header_index + 1:], header_index + 2):
        if name_i >= len(row) or not row[name_i]: continue
        name = str(row[name_i]).strip()
        barcode = str(row[barcode_i]).strip() if barcode_i is not None and barcode_i < len(row) and row[barcode_i] is not None else None
        barcode = re.sub(r"\s+", "", barcode or "") or None
        price = row[price_i] if price_i is not None and price_i < len(row) else None
        origin = classify_origin(barcode) if barcode else {"origin": "Unknown", "gs1_country_code": None}
        products.append((row[no_i] if no_i is not None and no_i < len(row) else row_number, barcode, name, float(price) if isinstance(price, (int, float)) else None, origin["origin"], origin["gs1_country_code"], infer_category(name), True, True))
    return products

def apply_metadata(cursor, path: Path):
    with path.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            fields = {key: value.strip() for key, value in row.items() if key and value is not None}
            updates = {key: fields[key] for key in ("category", "promo_label") if fields.get(key)}
            for key in ("is_own_import", "is_featured", "is_promo", "in_stock"):
                value = as_bool(fields.get(key));
                if value is not None: updates[key] = value
            if not updates: continue
            sets = ", ".join(f"{key} = %s" for key in updates)
            values = list(updates.values())
            if fields.get("barcode"):
                cursor.execute(f"UPDATE vet_inventory_app.products SET {sets} WHERE barcode = %s", values + [fields["barcode"]])
            elif fields.get("name"):
                cursor.execute(f"UPDATE vet_inventory_app.products SET {sets} WHERE name = %s", values + [fields["name"]])

def main():
    parser = argparse.ArgumentParser(); parser.add_argument("xlsx", type=Path); parser.add_argument("--metadata", type=Path); args = parser.parse_args()
    database_url = os.environ.get("DATABASE_URL")
    if not database_url: raise SystemExit("DATABASE_URL is required. Do not put database passwords in this script.")
    products = parse_catalog(args.xlsx)
    if not products: raise SystemExit("No products were parsed")
    with psycopg2.connect(database_url) as conn:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE vet_inventory_app.products SET is_active = FALSE")
            execute_values(cursor, """INSERT INTO vet_inventory_app.products (row_no,barcode,name,price,origin,gs1_country_code,category,is_active,in_stock)
              VALUES %s ON CONFLICT (barcode,name) DO UPDATE SET row_no=EXCLUDED.row_no,price=EXCLUDED.price,origin=EXCLUDED.origin,gs1_country_code=EXCLUDED.gs1_country_code,is_active=TRUE,in_stock=TRUE,category=CASE WHEN vet_inventory_app.products.category IN ('Без категорії','Інше') THEN EXCLUDED.category ELSE vet_inventory_app.products.category END""", products + [])
            if args.metadata: apply_metadata(cursor, args.metadata)
    print(f"Imported {len(products)} products. Missing items were marked inactive.")
if __name__ == "__main__": main()
