#!/usr/bin/env python3
"""Replace the supplier catalog from an XLSX and preserve merchandising metadata.

Usage:
  DATABASE_URL='postgresql://...' python scripts/import_catalog.py /path/to/price.xlsx \
    --metadata catalog_metadata.csv

The supplier file must contain No, Barcode, Name and Price columns (header may be
anywhere in the first 10 rows). Metadata is optional and has columns:
barcode,name,category,is_own_import,is_featured,is_promo,promo_label,image_url,in_stock
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
    ("Вакцини", ("вакцин", "nobivac", "eurican", "biocan", "вангард", "vanguard", "мультикан", "дурамун")),
    ("Знеболювальні та протизапальні", ("мелокс", "карпроф", "кетопроф", "знебол")),
    ("Вітаміни та добавки", ("вітам", "омега", "кальц", "пробіот", "добавк")),
    ("Догляд та гігієна", ("шампун", "сервет", "пелюш", "гігієн", "лосьйон")),
    ("Витратні матеріали", ("шприц", "голк", "катетер", "бинт", "рукавич", "систем")),
]

# Price lists are arranged as repeated category-heading + column-heading + product
# blocks. Keep supplier sections rather than guessing from individual product names.
SECTION_CATEGORIES = [
    ("вакцини та сироватки", "Вакцини"),
    ("протипаразитарні препарати", "Протипаразитарні"),
    ("антибіотики", "Антибіотики"),
    ("протизапальні", "Знеболювальні та протизапальні"),
    ("гормональні препарати", "Гормональні та репродукція"),
    ("вітаміни, мінерали", "Вітаміни та добавки"),
    ("стоматологія, офтальмологія", "Стоматологія, очі та вуха"),
    ("дерматологічні та загоювальні", "Дерматологія та загоєння"),
    ("кардіологія", "Кардіологія та внутрішні хвороби"),
    ("анестезія та загальні", "Анестезія та седативні"),
    ("аерозолі, тест-системи", "Аерозолі та тест-системи"),
    ("інфузійні розчини", "Інфузійні розчини та мікрочіпи"),
    ("дезінфекція, антисептика", "Дезінфекція та антисептика"),
    ("витратні матеріали, інструментарій", "Витратні матеріали та обладнання"),
    ("зоотовари, гігієна", "Зоотовари, гігієна та амуніція"),
]


def infer_category(name: str) -> str:
    lowered = name.lower()
    for category, words in CATEGORY_RULES:
        if any(word in lowered for word in words):
            return category
    return "Інше"


def section_category(value: object) -> str | None:
    text = str(value or "").strip().lower()
    return next((category for heading, category in SECTION_CATEGORIES if heading in text), None)

def as_bool(value: str | None) -> bool | None:
    if value is None or not value.strip(): return None
    return value.strip().lower() in {"1", "true", "yes", "так", "y"}

def parse_catalog(path: Path):
    workbook = openpyxl.load_workbook(path, data_only=True, read_only=True)
    sheet = workbook.active
    if sheet is None:
        raise ValueError("Workbook has no active sheet")

    products = []
    active_category: str | None = None
    for row_number, row in enumerate(sheet.iter_rows(values_only=True), start=1):
        values = list(row) + [None] * 4
        no, barcode, name, price = values[:4]
        heading = next((category for cell in values if (category := section_category(cell))), None)
        if heading and not isinstance(price, (int, float)):
            active_category = heading
            continue

        # Product rows always have the four supplier columns. This ignores the
        # repeated column headings and category titles between product blocks.
        if not name or not isinstance(price, (int, float)):
            continue
        name = str(name).strip()
        barcode = re.sub(r"\s+", "", str(barcode or "")) or None
        origin = classify_origin(barcode) if barcode else {"origin": "Unknown", "gs1_country_code": None}
        row_no = int(no) if isinstance(no, int) or (isinstance(no, str) and no.strip().isdigit()) else row_number
        products.append((
            row_no, barcode, name, float(price), origin["origin"], origin["gs1_country_code"],
            active_category or infer_category(name), True, True,
        ))
    if not products:
        raise ValueError("No priced products were found in the workbook")
    return products

def apply_metadata(cursor, path: Path):
    with path.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            fields = {key: value.strip() for key, value in row.items() if key and value is not None}
            updates = {key: fields[key] for key in ("category", "promo_label", "image_url") if fields.get(key)}
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
            auto_categories = tuple(category for category, _ in CATEGORY_RULES) + ("Без категорії", "Інше")
            cursor.execute(
                "UPDATE vet_inventory_app.products SET category = 'Інше' WHERE category = ANY(%s)",
                (list(auto_categories),),
            )
            execute_values(cursor, """INSERT INTO vet_inventory_app.products (row_no,barcode,name,price,origin,gs1_country_code,category,is_active,in_stock)
              VALUES %s ON CONFLICT (barcode,name) DO UPDATE SET row_no=EXCLUDED.row_no,price=EXCLUDED.price,origin=EXCLUDED.origin,gs1_country_code=EXCLUDED.gs1_country_code,is_active=TRUE,in_stock=TRUE,category=CASE WHEN vet_inventory_app.products.category IN ('Без категорії','Інше') THEN EXCLUDED.category ELSE vet_inventory_app.products.category END""", products)
            if args.metadata: apply_metadata(cursor, args.metadata)
    print(f"Imported {len(products)} products. Missing items were marked inactive.")
if __name__ == "__main__": main()
