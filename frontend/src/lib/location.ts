import { useSyncExternalStore } from "react";
import { MAP_DEFAULT_CENTER } from "@/lib/config";
import { FALLBACK_RATES, MAX_DELIVERY_KM } from "@/lib/delivery";
import type { DeliveryRate, LatLng } from "@/lib/types";

/* ------------------------------------------------------------------ saved delivery location (browser only) */

export type SavedLocation = {
  city: string;
  area: string;
  /** null when the map position could not be looked up; the customer then drops a pin at checkout */
  latitude: number | null;
  longitude: number | null;
  /** street-level text from reverse geocoding, used to pre-fill the checkout address (editable there) */
  address?: string;
  source: "auto" | "manual" | "pin";
  /** changes on every save, so other components can react to "a new location was chosen" */
  stamp: number;
};

type State = { saved: SavedLocation | null; modalOpen: boolean };
const KEY = "cravy-location-v1";
const DISMISS_KEY = "cravy-location-dismissed";
let state: State = { saved: null, modalOpen: false };
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const parse = (raw: string | null): SavedLocation | null => {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as SavedLocation;
    const ok = v && typeof v.city === "string" && typeof v.area === "string" && typeof v.stamp === "number" &&
      (v.latitude === null || typeof v.latitude === "number") && (v.longitude === null || typeof v.longitude === "number");
    return ok ? v : null;
  } catch { return null; }
};

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { state = { ...state, saved: parse(window.localStorage.getItem(KEY)) }; } catch { /* storage blocked */ }
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { state = { ...state, saved: parse(e.newValue) }; emit(); } }; // another tab changed it
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

export const useSavedLocation = () => useSyncExternalStore(subscribe, () => { load(); return state.saved; }, () => null);
export const useLocationModalOpen = () => useSyncExternalStore(subscribe, () => state.modalOpen, () => false);

export function saveLocation(l: Omit<SavedLocation, "stamp">): SavedLocation {
  const saved = { ...l, stamp: Date.now() };
  state = { ...state, saved };
  try { window.localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* storage blocked: it still works for this visit */ }
  emit();
  return saved;
}
export function openLocationModal() { state = { ...state, modalOpen: true }; emit(); }
/** `dismiss` remembers "not now" for this browser session so the popup does not keep coming back. */
export function closeLocationModal(dismiss = false) {
  state = { ...state, modalOpen: false };
  if (dismiss) { try { window.sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ } }
  emit();
}
export const wasDismissed = () => { try { return window.sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; } };

/* ------------------------------------------------------------------ distance and delivery estimate (display only) */

type Pt = { lat: number; lng: number };
export function haversineKm(a: Pt, b: Pt): number {
  const r = 6371.0088, rad = (d: number) => (d * Math.PI) / 180;
  const dp = rad(b.lat - a.lat), dl = rad(b.lng - a.lng);
  const h = Math.sin(dp / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

export type Estimate = { km: number; band: string | null; charge: number | null; inRange: boolean };
/** Same maths as the server (straight line to the shop, then the fixed rate table). The order itself is always priced by the server. */
export function estimateDelivery(latitude: number, longitude: number, rates: DeliveryRate[] = FALLBACK_RATES): Estimate {
  const km = Math.round(haversineKm({ lat: MAP_DEFAULT_CENTER[0], lng: MAP_DEFAULT_CENTER[1] }, { lat: latitude, lng: longitude }) * 100) / 100;
  const band = km <= MAX_DELIVERY_KM ? rates.find((r) => km <= r.to_km) : undefined;
  return { km, band: band?.label ?? null, charge: band ? band.charge : null, inRange: !!band };
}

/* ------------------------------------------------------------------ map lookups (OpenStreetMap Nominatim, browser to browser) */

const NOMINATIM = "https://nominatim.openstreetmap.org";
const KARACHI_VIEWBOX = "66.80,25.20,67.45,24.70"; // left, top, right, bottom
export const inKarachi = (lat: number, lng: number) => lat > 24.7 && lat < 25.3 && lng > 66.8 && lng < 67.5;

/** Turns GPS coordinates into an area name and a street line. Never throws; returns nulls when the lookup fails. */
export async function reverseGeocode(latitude: number, longitude: number, signal?: AbortSignal): Promise<{ area: string | null; address: string | null }> {
  try {
    const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=17&accept-language=en&lat=${latitude}&lon=${longitude}`, { signal });
    if (!r.ok) return { area: null, address: null };
    const a = ((await r.json()) as { address?: Record<string, string> }).address ?? {};
    const area = a.neighbourhood || a.quarter || a.suburb || a.city_district || a.residential || null;
    const address = [a.road, area].filter(Boolean).join(", ") || null;
    return { area, address };
  } catch { return { area: null, address: null }; }
}

/** Finds the map position of a named area (cached in the browser). "Block 20" falls back to the whole neighbourhood. */
export async function geocodeArea(area: string, city: string, signal?: AbortSignal): Promise<LatLng | null> {
  const cacheKey = "cravy-geo-v1";
  let cache: Record<string, [number, number]> = {};
  try { cache = JSON.parse(window.localStorage.getItem(cacheKey) ?? "{}"); } catch { /* ignore */ }
  const queries = [`${area}, ${city}, Pakistan`, `${area.replace(/\s*block\s*[\w-]+/i, "").trim()}, ${city}, Pakistan`];
  for (const q of [...new Set(queries)]) {
    if (cache[q]) return { latitude: cache[q][0], longitude: cache[q][1] };
    try {
      const r = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=1&countrycodes=pk&bounded=1&viewbox=${KARACHI_VIEWBOX}&accept-language=en&q=${encodeURIComponent(q)}`, { signal });
      if (!r.ok) continue;
      const hit = ((await r.json()) as { lat: string; lon: string }[])[0];
      if (hit) {
        const pt: [number, number] = [Number(hit.lat), Number(hit.lon)];
        cache[q] = pt;
        try { window.localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch { /* ignore */ }
        return { latitude: pt[0], longitude: pt[1] };
      }
    } catch { /* try the next query */ }
  }
  return null;
}