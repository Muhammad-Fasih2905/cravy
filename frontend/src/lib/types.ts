/** price = regular price. final_price = what the customer pays after the product discount (the server sends both). */
export type Variant = { id: number; name: string; price: number; is_available: boolean; final_price?: number };
export type Addon = { id: number; name: string; price: number; is_available: boolean };
export type Product = {
  id: number; category_id: number; name: string; slug: string; description: string | null;
  image_url: string | null; base_price: number; is_available: boolean; is_bestseller: boolean;
  is_featured: boolean; prep_minutes: number | null; is_demo: boolean; variants: Variant[]; addons: Addon[];
  /** 0-90, set by the admin. 0 = no discount. */
  discount_percent?: number; final_base_price?: number;
};
export type Category = { id: number; name: string; slug: string; products: Product[] };
export type Menu = { categories: Category[] };
export type PublicSettings = {
  business_name: string; phone: string | null; announcement: string | null;
  min_order_value: number; tax_percent: number; cod_enabled: boolean; easypaisa_enabled: boolean;
  easypaisa_name: string | null; easypaisa_number: string | null;
};
export type PaymentMethodId = "COD" | "EASYPAISA";
/** GET /api/payment-methods */
export type PaymentMethodInfo = {
  method: PaymentMethodId; label: string; enabled: boolean; description: string;
  account_number?: string; account_name?: string | null;
};
export type CartLineInput = { product_id: number; variant_id: number | null; addon_ids: number[]; quantity: number };
export type QuoteLine = {
  product_id: number; product_name: string; variant_name: string | null;
  addons: { name: string; price: number }[]; unit_price: number; quantity: number; line_total: number;
};
export type Quote = {
  lines: QuoteLine[]; subtotal: number; delivery_charge: number; discount_total: number; tax_total: number; total: number;
  coupon_code: string | null; meets_minimum: boolean; min_order_value: number;
  /** true until the customer has pinned a delivery location */
  delivery_pending: boolean;
  /** straight-line distance from the shop, measured by the server */
  distance_km: number | null; delivery_band: string | null;
  /** false when the pin is beyond the 10 km delivery range */
  deliverable: boolean; delivery_message: string | null;
};
export type DeliveryRate = { label: string; from_km: number; to_km: number; charge: number; free: boolean };
export type DeliveryRates = { max_km: number; rates: DeliveryRate[] };
export type LatLng = { latitude: number; longitude: number };
export type OrderInput = {
  items: CartLineInput[]; coupon_code?: string | null; latitude: number; longitude: number; customer_name: string; customer_phone: string;
  customer_email?: string | null; city: string; address: string; landmark?: string | null;
  instructions?: string | null; payment_method: PaymentMethodId;
};
/** Shown only while an Easypaisa payment is still due. */
export type PaymentInstructions = {
  method: string; account_number: string; account_name: string | null; amount: number; reference: string; message: string;
};
/** A new order is PENDING. The admin moves it to COMPLETED when the payment has come in, or CANCELLED. */
export type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "AWAITING_PAYMENT" | "PENDING_VERIFICATION" | "PAID" | "FAILED" | "REFUNDED";
export type OrderResult = {
  order_number: string; status: OrderStatus; subtotal: number; delivery_charge: number; discount_total: number;
  tax_total: number; total: number; payment_method: string; payment_status: PaymentStatus | string;
  payment_instructions: PaymentInstructions | null;
};