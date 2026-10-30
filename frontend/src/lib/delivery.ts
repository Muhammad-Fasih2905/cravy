import type { DeliveryRate } from "@/lib/types";

/**
 * The permanent delivery price list (distance from the shop to the customer's map pin).
 * The server is the only place that decides the real charge; this copy is for display and
 * as a fallback if GET /api/delivery-rates cannot be reached. A distance exactly on a
 * boundary belongs to the cheaper band (1.00 km is free, 2.00 km is Rs. 79).
 */
export const MAX_DELIVERY_KM = 10;

const LIMITS: [number, number][] = [[1, 0], [2, 79], [3, 99], [4, 149], [5, 199], [6, 219], [7, 239], [8, 249], [9, 269], [10, 299]];

export const FALLBACK_RATES: DeliveryRate[] = LIMITS.map(([to, charge], i) => ({
  label: to === 1 ? "Up to 1 km" : `${LIMITS[i - 1][0]}-${to} km`,
  from_km: i === 0 ? 0 : LIMITS[i - 1][0], to_km: to, charge, free: charge === 0,
}));