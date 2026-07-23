export interface Product {
  id: number;
  row_no: number | null;
  barcode: string | null;
  name: string;
  price: number | null;
  origin: "Ukraine" | "Abroad" | "Unknown";
  gs1_country_code: string | null;
  availability_status: "available" | "unavailable" | "pending" | "unknown";
  availability_checked_at: string | null;
  availability_source: string | null;
  availability_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  search: string;
  origin: Product["origin"] | "all";
  availability: Product["availability_status"] | "all";
  minPrice: string;
  maxPrice: string;
}
