/**
 * One place for backend URLs. Trailing slashes are removed, so
 * NEXT_PUBLIC_API_URL=https://host/  and  https://host  both work
 * (otherwise requests become https://host//api/... and fail).
 */
const clean = (u: string) => u.trim().replace(/\/+$/, "");

/** Used in the browser (client components). */
export const PUBLIC_API = clean(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

/** Used on the Next.js server (server components, sitemap). Falls back to the public URL. */
export const SERVER_API = clean(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

/** Works in both places. */
export const API_BASE = typeof window === "undefined" ? SERVER_API : PUBLIC_API;

/** Easypaisa limits enforced by the backend (kept here so the form can check before sending). */
export const TID_PATTERN = /^[A-Za-z0-9-]{6,40}$/;
export const RECEIPT_MAX_MB = 5;
export const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Where the delivery map opens before the customer drops a pin (the shop, Gulshan-e-Iqbal, Karachi). Distance is always measured by the server. */
export const MAP_DEFAULT_CENTER: [number, number] = [24.911012, 67.105612];