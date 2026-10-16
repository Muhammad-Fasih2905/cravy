export type Variant = { id: number; name: string; price: number; is_available: boolean };
export type Addon = { id: number; name: string; price: number; is_available: boolean };
export type Product = {
  id: number; category_id: number; name: string; slug: string; description: string | null;
  image_url: string | null; base_price: number; is_available: boolean; is_bestseller: boolean;
  is_featured: boolean; prep_minutes: number | null; is_demo: boolean; variants: Variant[]; addons: Addon[];
};
export type Category = { id: number; name: string; slug: string; products: Product[] };
export type Menu = { categories: Category[] };
export type PublicSettings = {
  business_name: string; phone: string | null; announcement: string | null; delivery_charge: number;
  min_order_value: number; tax_percent: number; cod_enabled: boolean; easypaisa_enabled: boolean; bank_enabled: boolean;
};
export type Zone = { id: number; name: string; city: string; charge: number; free_above: number | null; min_order: number | null };
export type CartLineInput = { product_id: number; variant_id: number | null; addon_ids: number[]; quantity: number };
export type QuoteLine = {
  product_id: number; product_name: string; variant_name: string | null;
  addons: { name: string; price: number }[]; unit_price: number; quantity: number; line_total: number;
};
export type Quote = {
  lines: QuoteLine[]; subtotal: number; delivery_charge: number; discount_total: number; tax_total: number; total: number;
  coupon_code: string | null; meets_minimum: boolean; min_order_value: number; delivery_pending: boolean; zone_name: string | null;
};
export type OrderInput = {
  items: CartLineInput[]; coupon_code?: string | null; zone_id?: number | null; customer_name: string; customer_phone: string;
  customer_email?: string | null; city: string; address: string; landmark?: string | null;
  instructions?: string | null; payment_method: "COD" | "EASYPAISA" | "BANK_TRANSFER";
};
export type OrderResult = {
  order_number: string; status: string; subtotal: number; delivery_charge: number; discount_total: number;
  tax_total: number; total: number; payment_method: string; payment_status: string;
};
