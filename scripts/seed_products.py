#!/usr/bin/env python3
"""Initial one-time import. For recurring imports use import_catalog.py instead.

Requires DATABASE_URL. Credentials must live in the shell environment or an ignored
local env file, never in source control.
"""
from pathlib import Path
import os
import re
import openpyxl
import psycopg2
from barcode_origin import classify_origin

EXCEL_PATH = Path.home() / ".hermes/cache/documents/doc_6f0be523ec25_Прайс_лист_16_07_26_1aa58cdd_6672_48d6_921e_263eeb4b28ae_2.xlsx"

def parse_excel(path: Path):
    workbook = openpyxl.load_workbook(path, data_only=True, read_only=True)
    sheet = workbook.active
    rows = list(sheet.iter_rows(values_only=True))
    products = []
    for index, row in enumerate(rows[4:], start=5):
        if not row or len(row) < 3 or not row[2]: continue
        no, barcode, name, price = (list(row) + [None] * 4)[:4]
        barcode = re.sub(r"\s+", "", str(barcode)) if barcode else None
        origin = classify_origin(barcode) if barcode else {"origin": "Unknown", "gs1_country_code": None}
        products.append((int(no) if str(no).isdigit() else index, barcode, str(name).strip(), float(price) if isinstance(price, (int, float)) else None, origin["origin"], origin["gs1_country_code"]))
    return products

def main():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url: raise SystemExit("DATABASE_URL is required")
    products = parse_excel(EXCEL_PATH)
    with psycopg2.connect(database_url) as conn:
        with conn.cursor() as cursor:
            for product in products:
                cursor.execute("""INSERT INTO vet_inventory_app.products (row_no,barcode,name,price,origin,gs1_country_code)
                  VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (barcode,name) DO UPDATE SET
                  row_no=EXCLUDED.row_no,price=EXCLUDED.price,origin=EXCLUDED.origin,gs1_country_code=EXCLUDED.gs1_country_code""", product)
    print(f"Imported {len(products)} products")
if __name__ == "__main__": main()
