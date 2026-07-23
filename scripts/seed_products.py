import json
from pathlib import Path
import re
import openpyxl
import psycopg2
from barcode_origin import classify_origin

EXCEL_PATH = Path.home() / '.hermes/cache/documents/doc_6f0be523ec25_Прайс_лист_16_07_26_1aa58cdd_6672_48d6_921e_263eeb4b28ae_2.xlsx'
DB_HOST = 'db.phgogybfgovrlcdmifpv.supabase.co'
DB_NAME = 'postgres'
DB_USER = 'postgres'
DB_PASSWORD = 'NsHd9sN7FnP3Tpae'


def parse_excel(path: Path):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb['Sheet1']
    rows = list(ws.iter_rows(values_only=True))
    headers = rows[3]  # No, Barcode, Name, Price
    data = rows[4:]
    products = []
    for idx, row in enumerate(data, start=5):
        if not row or all(cell is None for cell in row):
            continue
        no, barcode, name, price = row
        if name is None:
            continue
        barcode = re.sub(r'\s+', '', str(barcode)) if barcode else None
        if barcode == '' or barcode == 'None':
            barcode = None
        origin_info = classify_origin(barcode) if barcode else {'origin': 'Unknown', 'gs1_country_code': None}
        products.append({
            'row_no': int(no) if isinstance(no, (int, float, str)) and str(no).strip().isdigit() else idx,
            'barcode': barcode,
            'name': str(name).strip(),
            'price': float(price) if isinstance(price, (int, float)) else None,
            'origin': origin_info['origin'],
            'gs1_country_code': origin_info['gs1_country_code'],
            'availability_status': 'unknown',
        })
    return products


def upsert_products(products: list):
    conn = psycopg2.connect(host=DB_HOST, port=5432, database=DB_NAME, user=DB_USER, password=DB_PASSWORD)
    cur = conn.cursor()
    inserted = 0
    updated = 0
    for p in products:
        cur.execute(
            """
            INSERT INTO vet_inventory_app.products
            (row_no, barcode, name, price, origin, gs1_country_code, availability_status)
            VALUES (%(row_no)s, %(barcode)s, %(name)s, %(price)s, %(origin)s, %(gs1_country_code)s, %(availability_status)s)
            ON CONFLICT (barcode, name) DO UPDATE SET
                row_no = EXCLUDED.row_no,
                price = EXCLUDED.price,
                origin = EXCLUDED.origin,
                gs1_country_code = EXCLUDED.gs1_country_code,
                updated_at = now()
            RETURNING (xmax = 0) AS inserted;
            """,
            p
        )
        result = cur.fetchone()
        if result and result[0]:
            inserted += 1
        else:
            updated += 1
    conn.commit()
    conn.close()
    return inserted, updated


if __name__ == '__main__':
    products = parse_excel(EXCEL_PATH)
    print(f'Parsed {len(products)} products')
    origin_counts = {}
    for p in products:
        origin_counts[p['origin']] = origin_counts.get(p['origin'], 0) + 1
    print('Origin distribution:', origin_counts)
    inserted, updated = upsert_products(products)
    print(f'Inserted: {inserted}, Updated: {updated}')
