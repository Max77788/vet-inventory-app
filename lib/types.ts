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
  category: string;
  is_own_import: boolean;
  is_featured: boolean;
  is_promo: boolean;
  promo_label: string | null;
  image_url?: string | null;
  is_active: boolean;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  search: string;
  category: string;
  onlyPriority: boolean;
  pageSize: number;
  sortBy: "row_no" | "name" | "price";
  sortOrder: "asc" | "desc";
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface QuoteRequestInput {
  customerName: string;
  customerPhone?: string;
  customerComment?: string;
  items: Array<{ productId: number; quantity: number }>;
}
