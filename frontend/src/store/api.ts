import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Menu, OrderInput, OrderResult, Product, PublicSettings, Quote, CartLineInput, Zone } from "@/lib/types";

// Browser calls NEXT_PUBLIC_API_URL; the Next.js server (preloading) calls API_URL.
const baseUrl =
  typeof window === "undefined"
    ? process.env.API_URL ?? "https://cravy-backend-production.up.railway.app"
    : process.env.NEXT_PUBLIC_API_URL ?? "https://cravy-backend-production.up.railway.app";

export type AdminOrder = {
  order_number: string; status: string; created_at: string; customer_name: string; customer_phone: string;
  customer_email: string | null; city: string; address: string; landmark: string | null; instructions: string | null;
  subtotal: number; delivery_charge: number; discount_total: number; tax_total: number; delivery_zone: string | null; total: number; coupon_code: string | null;
  items: { name: string; variant: string | null; addons: { name: string; price: number }[]; quantity: number; line_total: number }[];
  payment_method: string; payment_status: string; transaction_ref: string | null; admin_note: string | null; has_receipt: boolean;
};
export type AdminStats = {
  total_orders: number; today_orders: number; total_sales: number; pending_orders: number; completed_orders: number;
  pending_payments: number; bestsellers: { name: string; quantity: number }[]; daily_sales: { date: string; total: number }[];
};
export type AdminProduct = {
  id: number; name: string; slug: string; base_price: number; is_available: boolean; is_bestseller: boolean;
  is_featured: boolean; is_demo: boolean; category: string; image_url: string | null;
};
export type AdminZone = Zone & { is_active: boolean };
export type OptionRow = { id?: number; name: string; price: number; is_available: boolean };
export type ProductOptions = { variants: OptionRow[]; addons: OptionRow[] };
export type AdminSettings = Record<string, string | number | boolean | null>;

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    // On the server, let Next cache the response for 60s so pages stay fast.
    fetchFn: (input, init) => fetch(input, { ...init, next: { revalidate: 60 } } as RequestInit),
    prepareHeaders: (h, { endpoint }) => {
      // The admin token is only attached to admin endpoints. The server verifies it on every request.
      if (typeof window !== "undefined" && endpoint.startsWith("admin")) {
        const t = sessionStorage.getItem("cravy-admin");
        if (t) h.set("authorization", `Bearer ${t}`);
      }
      return h;
    },
  }),
  tagTypes: ["Menu", "Settings", "Orders", "Stats", "AdminSettings", "AdminProducts", "Zones", "Options"],
  keepUnusedDataFor: 300,
  endpoints: (b) => ({
    getMenu: b.query<Menu, void>({ query: () => "/api/menu", providesTags: ["Menu"] }),
    getSettings: b.query<PublicSettings, void>({ query: () => "/api/settings", providesTags: ["Settings"] }),
    getProduct: b.query<Product, string>({ query: (slug) => `/api/products/${slug}` }),
    getZones: b.query<Zone[], void>({ query: () => "/api/zones", providesTags: ["Zones"] }),
    getQuote: b.mutation<Quote, { items: CartLineInput[]; coupon_code?: string | null; zone_id?: number | null }>({
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
    adminOrders: b.query<AdminOrder[], { status?: string; method?: string; q?: string }>({
      query: (p) => ({ url: "/api/admin/orders", params: Object.fromEntries(Object.entries(p).filter(([, v]) => v)) }),
      providesTags: ["Orders"],
    }),
    adminSetStatus: b.mutation<AdminOrder, { n: string; status: string }>({
      query: ({ n, status }) => ({ url: `/api/admin/orders/${n}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: ["Orders", "Stats"],
    }),
    adminSetPayment: b.mutation<AdminOrder, { n: string; status: string; note?: string }>({
      query: ({ n, ...body }) => ({ url: `/api/admin/orders/${n}/payment`, method: "PATCH", body }),
      invalidatesTags: ["Orders", "Stats"],
    }),
    adminSettings: b.query<AdminSettings, void>({ query: () => "/api/admin/settings", providesTags: ["AdminSettings"] }),
    adminSaveSettings: b.mutation<AdminSettings, Partial<AdminSettings>>({
      query: (body) => ({ url: "/api/admin/settings", method: "PUT", body }),
      invalidatesTags: ["AdminSettings", "Settings"],
    }),
    adminProducts: b.query<AdminProduct[], void>({ query: () => "/api/admin/products", providesTags: ["AdminProducts"] }),
    adminPatchProduct: b.mutation<unknown, { id: number } & Partial<Omit<AdminProduct, "id">>>({
      query: ({ id, ...body }) => ({ url: `/api/admin/products/${id}`, method: "PATCH", body }),
      invalidatesTags: ["AdminProducts", "Menu"],
    }),
    adminCategories: b.query<{ id: number; name: string }[], void>({ query: () => "/api/admin/categories" }),
    adminCreateProduct: b.mutation<unknown, { name: string; category_id: number; base_price: number }>({
      query: (body) => ({ url: "/api/admin/products", method: "POST", body }), invalidatesTags: ["AdminProducts", "Menu"],
    }),
    adminDeleteProduct: b.mutation<unknown, number>({
      query: (id) => ({ url: `/api/admin/products/${id}`, method: "DELETE" }), invalidatesTags: ["AdminProducts", "Menu"],
    }),
    adminZones: b.query<AdminZone[], void>({ query: () => "/api/admin/zones", providesTags: ["Zones"] }),
    adminCreateZone: b.mutation<AdminZone, { name: string; city: string; charge: number; free_above?: number | null; min_order?: number | null }>({
      query: (body) => ({ url: "/api/admin/zones", method: "POST", body }), invalidatesTags: ["Zones"],
    }),
    adminPatchZone: b.mutation<AdminZone, { id: number } & Partial<Omit<AdminZone, "id">>>({
      query: ({ id, ...body }) => ({ url: `/api/admin/zones/${id}`, method: "PATCH", body }), invalidatesTags: ["Zones"],
    }),
    adminDeleteZone: b.mutation<unknown, number>({ query: (id) => ({ url: `/api/admin/zones/${id}`, method: "DELETE" }), invalidatesTags: ["Zones"] }),
    adminOptions: b.query<ProductOptions, number>({ query: (id) => `/api/admin/products/${id}/options`, providesTags: ["Options"] }),
    adminSaveOptions: b.mutation<ProductOptions, { id: number } & ProductOptions>({
      query: ({ id, ...body }) => ({ url: `/api/admin/products/${id}/options`, method: "PUT", body }), invalidatesTags: ["Options", "Menu"],
    }),
  }),
});

export const {
  useGetZonesQuery, useAdminZonesQuery, useAdminCreateZoneMutation, useAdminPatchZoneMutation, useAdminDeleteZoneMutation,
  useAdminOptionsQuery, useAdminSaveOptionsMutation,
  useAdminCategoriesQuery, useAdminCreateProductMutation, useAdminDeleteProductMutation,
  useGetMenuQuery, useGetSettingsQuery, useGetProductQuery, useGetQuoteMutation, useCreateOrderMutation,
  useAdminLoginMutation, useAdminStatsQuery, useAdminOrdersQuery, useAdminSetStatusMutation, useAdminSetPaymentMutation,
  useAdminSettingsQuery, useAdminSaveSettingsMutation, useAdminProductsQuery, useAdminPatchProductMutation,
} = api;
