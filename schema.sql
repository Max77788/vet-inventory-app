-- Veterinary catalog and quote-request schema.
-- Run this file against the Supabase Postgres database. It is idempotent.

CREATE SCHEMA IF NOT EXISTS vet_inventory_app;

CREATE TABLE IF NOT EXISTS vet_inventory_app.products (
    id BIGSERIAL PRIMARY KEY,
    row_no INTEGER,
    barcode TEXT,
    name TEXT NOT NULL,
    price NUMERIC(12,2),
    origin TEXT CHECK (origin IN ('Ukraine','Abroad','Unknown')),
    gs1_country_code TEXT,
    availability_status TEXT CHECK (availability_status IN ('available','unavailable','unknown','pending')),
    availability_checked_at TIMESTAMP WITH TIME ZONE,
    availability_source TEXT,
    availability_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Catalog merchandising fields. Values can be maintained from the metadata CSV
-- without changing the supplier price list.
ALTER TABLE vet_inventory_app.products
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Без категорії',
    ADD COLUMN IF NOT EXISTS is_own_import BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_promo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS promo_label TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS in_stock BOOLEAN NOT NULL DEFAULT TRUE;

DROP INDEX IF EXISTS vet_inventory_app.idx_products_barcode_name;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_name
    ON vet_inventory_app.products(barcode, name);
CREATE INDEX IF NOT EXISTS idx_products_category_active
    ON vet_inventory_app.products(category, is_active);
CREATE INDEX IF NOT EXISTS idx_products_catalog_priority
    ON vet_inventory_app.products(is_active, is_own_import DESC, is_featured DESC, is_promo DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_search
    ON vet_inventory_app.products USING gin (to_tsvector('simple', name));

CREATE TABLE IF NOT EXISTS vet_inventory_app.quote_requests (
    id BIGSERIAL PRIMARY KEY,
    request_code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_comment TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'completed', 'cancelled')),
    total_items INTEGER NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vet_inventory_app.quote_request_items (
    id BIGSERIAL PRIMARY KEY,
    quote_request_id BIGINT NOT NULL REFERENCES vet_inventory_app.quote_requests(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES vet_inventory_app.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    sku TEXT,
    unit_price NUMERIC(12,2),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at
    ON vet_inventory_app.quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_request_items_request_id
    ON vet_inventory_app.quote_request_items(quote_request_id);

CREATE OR REPLACE FUNCTION vet_inventory_app.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at ON vet_inventory_app.products;
CREATE TRIGGER trigger_set_updated_at
    BEFORE UPDATE ON vet_inventory_app.products
    FOR EACH ROW EXECUTE FUNCTION vet_inventory_app.set_updated_at();

ALTER TABLE vet_inventory_app.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_inventory_app.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_inventory_app.quote_request_items ENABLE ROW LEVEL SECURITY;

-- The catalog is publicly readable. Writes are intentionally server-side only.
DROP POLICY IF EXISTS allow_anon_select ON vet_inventory_app.products;
DROP POLICY IF EXISTS allow_anon_insert ON vet_inventory_app.products;
DROP POLICY IF EXISTS allow_anon_update ON vet_inventory_app.products;
CREATE POLICY allow_anon_select ON vet_inventory_app.products FOR SELECT TO anon USING (true);

GRANT USAGE ON SCHEMA vet_inventory_app TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA vet_inventory_app TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA vet_inventory_app TO anon, authenticated, service_role;
REVOKE INSERT, UPDATE, DELETE ON vet_inventory_app.products FROM anon, authenticated;

-- The browser uses this safe public projection. Internal quote tables are not exposed.
CREATE OR REPLACE VIEW public.products AS
SELECT
    -- Keep original view columns first so CREATE OR REPLACE is safe on an existing view.
    id, row_no, barcode, name, price, origin, gs1_country_code,
    availability_status, availability_checked_at, availability_source, availability_notes,
    created_at, updated_at,
    category, is_own_import, is_featured, is_promo, promo_label, is_active, in_stock
FROM vet_inventory_app.products;

GRANT SELECT ON public.products TO anon, authenticated, service_role;

-- Atomic server-side quote creation. The browser has no write privileges and the
-- API cannot trust a price submitted by the customer.
CREATE OR REPLACE FUNCTION public.create_quote_request(
    p_request_code TEXT,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_customer_comment TEXT,
    p_items JSONB
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = vet_inventory_app, public AS $$
DECLARE
    v_request_id BIGINT;
    v_product_count INTEGER;
    v_expected_count INTEGER;
    v_total_items INTEGER;
    v_total_amount NUMERIC(12,2);
BEGIN
    IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Quote must contain at least one item';
    END IF;
    WITH requested AS (
        SELECT product_id, SUM(quantity)::INTEGER AS quantity
        FROM jsonb_to_recordset(p_items) AS x(product_id BIGINT, quantity INTEGER)
        WHERE quantity > 0
        GROUP BY product_id
    ), valid AS (
        SELECT p.id, p.name, p.barcode, p.price, r.quantity
        FROM requested r JOIN vet_inventory_app.products p ON p.id = r.product_id
        WHERE p.is_active AND p.in_stock
    )
    SELECT (SELECT count(*) FROM requested), count(*), COALESCE(sum(quantity), 0), COALESCE(sum(price * quantity), 0)
    INTO v_expected_count, v_product_count, v_total_items, v_total_amount FROM valid;
    IF v_product_count <> v_expected_count THEN
        RAISE EXCEPTION 'One or more catalog products are unavailable';
    END IF;
    INSERT INTO vet_inventory_app.quote_requests (request_code, customer_name, customer_phone, customer_comment, total_items, total_amount)
    VALUES (p_request_code, p_customer_name, p_customer_phone, p_customer_comment, v_total_items, v_total_amount)
    RETURNING id INTO v_request_id;
    INSERT INTO vet_inventory_app.quote_request_items (quote_request_id, product_id, product_name, sku, unit_price, quantity, line_total)
    SELECT v_request_id, p.id, p.name, p.barcode, p.price, r.quantity, p.price * r.quantity
    FROM (
        SELECT product_id, SUM(quantity)::INTEGER AS quantity
        FROM jsonb_to_recordset(p_items) AS x(product_id BIGINT, quantity INTEGER)
        WHERE quantity > 0 GROUP BY product_id
    ) r JOIN vet_inventory_app.products p ON p.id = r.product_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_quote_request(TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;
