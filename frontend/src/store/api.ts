import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { CartLineInput, DeliveryRates, Menu, OrderInput, OrderResult, OrderStatus, PaymentMethodInfo, Product, PublicSettings, Quote } from "@/lib/types";
import { API_BASE as baseUrl } from "@/lib/config";
import { announceMenuChange } from "@/lib/menuSync";
// Browser calls NEXT_PUBLIC_API_URL; the Next.js server (preloading) calls API_URL. Trailing slashes are removed in config.

export type AdminOrder = {
  order_number: string; status: OrderStatus | string;
  created_at: string; updated_at: string; completed_at: string | null;
  customer_name: string; customer_phone: string; customer_email: string | null;
  city: string; address: string; landmark: string | null; instructions: string | null;
  latitude: number | null; longitude: number | null; map_url: string | null;
  /** distance from the shop in km and the delivery band, both measured by the server */
  distance_km: number | null; delivery_zone: string | null;
  subtotal: number; delivery_charge: number; discount_total: number; tax_total: number; total: number; coupon_code: string | null;
  items: { name: string; variant: string | null; addons: { name: string; price: number }[]; quantity: number; unit_price: number; line_total: number }[];
  payment_method: string; payment_status: string; payment_amount: number;
  transaction_ref: string | null; admin_note: string | null; has_receipt: boolean;
};
export type AdminStats = {
  total_orders: number; today_orders: number; pending_orders: number; completed_orders: number; cancelled_orders: number;
  /** money actually received (completed orders) */
  total_sales: number;
  /** still to be collected (pending orders) */
  pending_amount: number;
  pending_payments: number; awaiting_payments: number;
  bestsellers: { name: string; quantity: number }[]; daily_sales: { date: string; total: number }[];
};
export type SalesPoint = { key: string; label: string; total: number; orders: number; future: boolean };
export type SalesOrder = { order_number: string; time: string; total: number; customer: string; method: string | null; items: string };
export type SalesReport = {
  mode: "month" | "year" | "days" | "day"; year: number; month: number; days: number | null;
  /** only for mode "day": the date (YYYY-MM-DD) and that day's completed orders */
  date: string | null; orders_list: SalesOrder[];
  points: SalesPoint[]; total: number; orders: number; average_order: number;
  best: { key: string; label: string; total: number } | null;
  previous_total: number; change_percent: number | null;
  /** the period is still running (this month / this year), so it is compared with the same stretch of the previous one */
  partial: boolean;
  /** month of the very first completed order: the calendar starts here */
  first_sale: { year: number; month: number } | null;
  years: number[]; today: string; current: { year: number; month: number };
};
export type AdminProduct = {
  id: number; name: string; slug: string; base_price: number; is_available: boolean; is_bestseller: boolean;
  is_featured: boolean; is_demo: boolean; category: string; image_url: string | null;
  discount_percent: number; final_base_price: number;
};
/** Fields the admin can change on an existing product (PATCH /api/admin/products/{id}). */
export type ProductPatch = Partial<{
  name: string; description: string | null; base_price: number; is_available: boolean;
  is_bestseller: boolean; is_featured: boolean; discount_percent: number;
}>;
export type AdminBundle = { product_ids: number[]; items: { id: number; name: string; category: string | null; image_url: string | null; price: number; is_available: boolean }[] };
export type OptionRow = { id?: number; name: string; price: number; is_available: boolean };
export type ProductOptions = { variants: OptionRow[]; addons: OptionRow[] };
/** Free waffle choices. Toppings are managed in the admin; flavours are the available products of the Ice Cream category. */
export type WaffleOptionItem = { id: number; name: string; image_url: string | null };
export type WaffleOptions = { toppings: WaffleOptionItem[]; flavours: WaffleOptionItem[] };
export type AdminTopping = WaffleOptionItem & { is_available: boolean; sort_order: number; kind: "TOPPING" | "ICECREAM" };
export type AdminSettings = Record<string, string | number | boolean | null>;

/** Orders, carts, admin and the menu/products/settings must always come straight from the server, never from a cache (that is what makes menu changes show up at once). */
const LIVE = /\/api\/(admin|orders|cart|payment-methods|menu|products|settings|waffle-options)/;

/** After the admin changes a product, tell the other open tabs of this browser to refresh their menu immediately. */
const announce = async (_: unknown, { queryFulfilled }: { queryFulfilled: Promise<unknown> }) => {
  try { await queryFulfilled; announceMenuChange(); } catch { /* the caller shows the error */ }
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    fetchFn: async (input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      try {
        // Menu/settings pages may be cached for 60s on the Next.js server. Order data never is.
        const cacheOpts = LIVE.test(url) ? { cache: "no-store" } : { next: { revalidate: 60 } };
        return await fetch(input, { ...init, ...cacheOpts } as RequestInit);
      } catch (e) {
        // Shows exactly which URL and address failed (helps when the error is only "fetch failed").
        const where = ((e as { cause?: { errors?: { address?: string; port?: number }[]; address?: string; port?: number } })?.cause);
        const addrs = (where?.errors ?? [where]).filter(Boolean).map((x) => `${x?.address}:${x?.port}`).join(", ");
        console.error(`[api] request failed: ${url} -> ${addrs}`);
        throw e;
      }
    },
    prepareHeaders: (h, { endpoint }) => {
      // The admin token is only attached to admin endpoints. The server verifies it on every request.
      if (typeof window !== "undefined" && endpoint.startsWith("admin")) {
        const t = sessionStorage.getItem("cravy-admin");
        if (t) h.set("authorization", `Bearer ${t}`);
      }
      return h;
    },
  }),
  tagTypes: ["Menu", "Settings", "Orders", "Stats", "AdminSettings", "AdminProducts", "Options", "AdminCategories", "Bundle", "Toppings"],
  keepUnusedDataFor: 300,
  endpoints: (b) => ({
    getMenu: b.query<Menu, void>({ query: () => "/api/menu", providesTags: ["Menu"] }),
    getWaffleOptions: b.query<WaffleOptions, void>({ query: () => "/api/waffle-options", providesTags: ["Menu", "Toppings"] }),
    getSettings: b.query<PublicSettings, void>({ query: () => "/api/settings", providesTags: ["Settings"] }),
    getProduct: b.query<Product, string>({ query: (slug) => `/api/products/${slug}`, providesTags: ["Menu"] }),
    getDeliveryRates: b.query<DeliveryRates, void>({ query: () => "/api/delivery-rates" }),
    getPaymentMethods: b.query<PaymentMethodInfo[], void>({ query: () => "/api/payment-methods", providesTags: ["Settings"] }),
    // Send only ids, quantities and the customer's map pin. The server measures the distance and prices everything.
    getQuote: b.mutation<Quote, { items: CartLineInput[]; coupon_code?: string | null; latitude?: number | null; longitude?: number | null }>({
      query: (body) => ({ url: "/api/cart/quote", method: "POST", body }),
    }),
    createOrder: b.mutation<OrderResult, { body: OrderInput; idempotencyKey: string }>({
      query: ({ body, idempotencyKey }) => ({ url: "/api/orders", method: "POST", body, headers: { "Idempotency-Key": idempotencyKey } }),
    }),
    // ---- admin ----
    adminLogin: b.mutation<{ token: string }, { email: string; password: string }>({
      query: (body) => ({ url: "/api/admin/login", method: "POST", body }),
    }),
    adminStats: b.query<AdminStats, void>({ query: () => "/api/admin/stats", providesTags: ["Stats"] }),
    // Sales chart: ?year&month (a bar per day), ?year&month=0 (a bar per month) or ?days=7. Tagged "Stats", so the live order stream keeps it current.
    adminSales: b.query<SalesReport, { year?: number; month?: number; days?: number; date?: string }>({
      query: (a) => {
        const q = new URLSearchParams();
        if (a.date) q.set("date", a.date);
        else if (a.days) q.set("days", String(a.days));
        else { if (a.year !== undefined) q.set("year", String(a.year)); if (a.month !== undefined) q.set("month", String(a.month)); }
        return `/api/admin/sales?${q.toString()}`;
      },
      providesTags: ["Stats"],
    }),
    // ALL orders, kept fresh by the live stream (see useOrderStream). Filtering by status/search happens in the browser.
    adminOrders: b.query<AdminOrder[], void>({
      query: () => ({ url: "/api/admin/orders", params: { limit: 500 } }),
      providesTags: ["Orders"],
    }),
    // The server answers with the order exactly as it was saved. That saved order goes into the list, nothing is guessed.
    adminSetStatus: b.mutation<AdminOrder, { n: string; status: string }>({
      query: ({ n, status }) => ({ url: `/api/admin/orders/${n}/status`, method: "PATCH", body: { status } }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try { const { data } = await queryFulfilled; dispatch(upsertAdminOrder(data)); dispatch(api.util.invalidateTags(["Stats"])); } catch { /* error is shown by the caller */ }
      },
    }),
    adminSetPayment: b.mutation<AdminOrder, { n: string; status: string; note?: string }>({
      query: ({ n, ...body }) => ({ url: `/api/admin/orders/${n}/payment`, method: "PATCH", body }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try { const { data } = await queryFulfilled; dispatch(upsertAdminOrder(data)); dispatch(api.util.invalidateTags(["Stats"])); } catch { /* error is shown by the caller */ }
      },
    }),
    adminSettings: b.query<AdminSettings, void>({ query: () => "/api/admin/settings", providesTags: ["AdminSettings"] }),
    adminSaveSettings: b.mutation<AdminSettings, Partial<AdminSettings>>({
      query: (body) => ({ url: "/api/admin/settings", method: "PUT", body }),
      invalidatesTags: ["AdminSettings", "Settings"],
    }),
    adminProducts: b.query<AdminProduct[], void>({ query: () => "/api/admin/products", providesTags: ["AdminProducts"] }),
    adminPatchProduct: b.mutation<unknown, { id: number } & ProductPatch>({
      query: ({ id, ...body }) => ({ url: `/api/admin/products/${id}`, method: "PATCH", body }),
      invalidatesTags: ["AdminProducts", "Menu"], onQueryStarted: announce,
    }),
    adminCategories: b.query<{ id: number; name: string }[], void>({ query: () => "/api/admin/categories", providesTags: ["AdminCategories"] }),
    adminCreateCategory: b.mutation<{ id: number; name: string; slug: string; created: boolean }, { name: string }>({
      query: (body) => ({ url: "/api/admin/categories", method: "POST", body }), invalidatesTags: ["AdminCategories", "Menu"],
    }),
    adminCreateProduct: b.mutation<{ id: number }, { name: string; category_id: number; base_price: number }>({
      query: (body) => ({ url: "/api/admin/products", method: "POST", body }), invalidatesTags: ["AdminProducts", "Menu"], onQueryStarted: announce,
    }),
    adminDeleteProduct: b.mutation<unknown, number>({
      query: (id) => ({ url: `/api/admin/products/${id}`, method: "DELETE" }), invalidatesTags: ["AdminProducts", "Menu"], onQueryStarted: announce,
    }),
    adminBundle: b.query<AdminBundle, number>({ query: (id) => `/api/admin/products/${id}/bundle`, providesTags: ["Bundle"] }),
    adminSaveBundle: b.mutation<AdminBundle, { id: number; product_ids: number[] }>({
      query: ({ id, ...body }) => ({ url: `/api/admin/products/${id}/bundle`, method: "PUT", body }), invalidatesTags: ["Bundle", "Menu"], onQueryStarted: announce,
    }),
    adminToppings: b.query<AdminTopping[], void>({ query: () => "/api/admin/waffle-toppings", providesTags: ["Toppings"] }),
    adminAddTopping: b.mutation<AdminTopping, { name: string; kind: "TOPPING" | "ICECREAM" }>({
      query: (body) => ({ url: "/api/admin/waffle-toppings", method: "POST", body }), invalidatesTags: ["Toppings"], onQueryStarted: announce,
    }),
    adminPatchTopping: b.mutation<AdminTopping, { id: number } & Partial<{ name: string; is_available: boolean; sort_order: number }>>({
      query: ({ id, ...body }) => ({ url: `/api/admin/waffle-toppings/${id}`, method: "PATCH", body }), invalidatesTags: ["Toppings"], onQueryStarted: announce,
    }),
    adminDeleteTopping: b.mutation<unknown, number>({
      query: (id) => ({ url: `/api/admin/waffle-toppings/${id}`, method: "DELETE" }), invalidatesTags: ["Toppings"], onQueryStarted: announce,
    }),
    adminToppingImage: b.mutation<AdminTopping, { id: number; file: File | null }>({
      query: ({ id, file }) => {
        if (!file) return { url: `/api/admin/waffle-toppings/${id}/image`, method: "DELETE" };
        const body = new FormData(); body.append("file", file);
        return { url: `/api/admin/waffle-toppings/${id}/image`, method: "POST", body };
      },
      invalidatesTags: ["Toppings"], onQueryStarted: announce,
    }),
    adminOptions: b.query<ProductOptions, number>({ query: (id) => `/api/admin/products/${id}/options`, providesTags: ["Options"] }),
    adminSaveOptions: b.mutation<ProductOptions, { id: number } & ProductOptions>({
      query: ({ id, ...body }) => ({ url: `/api/admin/products/${id}/options`, method: "PUT", body }), invalidatesTags: ["Options", "Menu"], onQueryStarted: announce,
    }),
  }),
});

/** Insert a new order at the top, or replace an existing one, but never overwrite newer data with older data. */
export const upsertAdminOrder = (o: AdminOrder) =>
  api.util.updateQueryData("adminOrders", undefined, (draft) => {
    const i = draft.findIndex((x) => x.order_number === o.order_number);
    if (i === -1) {
      const at = draft.findIndex((x) => x.created_at < o.created_at);
      draft.splice(at === -1 ? draft.length : at, 0, o);
    } else if (!draft[i].updated_at || o.updated_at >= draft[i].updated_at) {
      draft[i] = o;
    }
  });

export const {
  useGetWaffleOptionsQuery, useAdminToppingsQuery, useAdminAddToppingMutation, useAdminPatchToppingMutation, useAdminDeleteToppingMutation, useAdminToppingImageMutation,
  useGetDeliveryRatesQuery,
  useAdminOptionsQuery, useAdminSaveOptionsMutation, useAdminBundleQuery, useAdminSaveBundleMutation,
  useAdminCategoriesQuery, useAdminCreateCategoryMutation, useAdminCreateProductMutation, useAdminDeleteProductMutation,
  useGetPaymentMethodsQuery, useGetMenuQuery, useGetSettingsQuery, useGetProductQuery, useGetQuoteMutation, useCreateOrderMutation,
  useAdminLoginMutation, useAdminStatsQuery, useAdminSalesQuery, useAdminOrdersQuery, useAdminSetStatusMutation, useAdminSetPaymentMutation,
  useAdminSettingsQuery, useAdminSaveSettingsMutation, useAdminProductsQuery, useAdminPatchProductMutation,
} = api;