-- Optional product image URL used by the compact catalog cards.
ALTER TABLE vet_inventory_app.products
  ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE OR REPLACE VIEW public.products AS
SELECT
    id, row_no, barcode, name, price, origin, gs1_country_code,
    availability_status, availability_checked_at, availability_source, availability_notes,
    created_at, updated_at,
    category, is_own_import, is_featured, is_promo, promo_label, image_url, is_active, in_stock
FROM vet_inventory_app.products;

GRANT SELECT ON public.products TO anon, authenticated, service_role;