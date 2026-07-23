-- Vet Inventory App schema
CREATE SCHEMA IF NOT EXISTS vet_inventory_app;

-- Products table
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

-- Unique index on barcode+name to avoid duplicates
DROP INDEX IF EXISTS vet_inventory_app.idx_products_barcode_name;
CREATE UNIQUE INDEX idx_products_barcode_name
    ON vet_inventory_app.products(barcode, name);

-- Indexes for filters
DROP INDEX IF EXISTS vet_inventory_app.idx_products_origin;
CREATE INDEX idx_products_origin ON vet_inventory_app.products(origin);
DROP INDEX IF EXISTS vet_inventory_app.idx_products_availability_status;
CREATE INDEX idx_products_availability_status ON vet_inventory_app.products(availability_status);
DROP INDEX IF EXISTS vet_inventory_app.idx_products_price;
CREATE INDEX idx_products_price ON vet_inventory_app.products(price);

-- Enable RLS
ALTER TABLE vet_inventory_app.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS allow_anon_select ON vet_inventory_app.products;
DROP POLICY IF EXISTS allow_anon_insert ON vet_inventory_app.products;
DROP POLICY IF EXISTS allow_anon_update ON vet_inventory_app.products;

-- Allow anonymous access (minimal permissions for this internal app)
CREATE POLICY allow_anon_select
    ON vet_inventory_app.products
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY allow_anon_insert
    ON vet_inventory_app.products
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY allow_anon_update
    ON vet_inventory_app.products
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Grant usage
GRANT USAGE ON SCHEMA vet_inventory_app TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA vet_inventory_app TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA vet_inventory_app TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA vet_inventory_app TO anon, authenticated, service_role;

-- Updated at trigger
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
