import json
from pathlib import Path
import re
from typing import Optional

# Load GS1 country code mapping
GS1_PATH = Path(__file__).with_name('gs1_country_codes.json')
GS1_CODES = json.loads(GS1_PATH.read_text(encoding='utf-8'))


def gs1_country(barcode: str) -> Optional[str]:
    """Return country name from EAN/UPC barcode prefix, or None."""
    if not barcode or not isinstance(barcode, str):
        return None
    digits = re.sub(r'\D', '', barcode)
    if not digits:
        return None
    for length in (3, 2, 1):
        prefix = digits[:length]
        if prefix in GS1_CODES:
            return GS1_CODES[prefix]
    return None


def classify_origin(barcode: str) -> dict:
    country = gs1_country(barcode)
    if country is None:
        return {'origin': 'Unknown', 'gs1_country_code': None}
    origin = 'Ukraine' if country == 'Ukraine' else 'Abroad'
    return {'origin': origin, 'gs1_country_code': country}
