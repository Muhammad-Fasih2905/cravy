"use client";
import { useGetDeliveryRatesQuery } from "@/store/api";
import { FALLBACK_RATES, MAX_DELIVERY_KM } from "@/lib/delivery";
import { formatPKR } from "@/lib/money";

/** The fixed delivery price list. `highlight` marks the band the customer's pin falls in (e.g. "2-3 km"). */
export function DeliveryRates({ highlight, compact }: { highlight?: string | null; compact?: boolean }) {
  const { data } = useGetDeliveryRatesQuery();
  const rates = data?.rates ?? FALLBACK_RATES;
  const max = data?.max_km ?? MAX_DELIVERY_KM;
  return (
    <div>
      <ul className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
        {rates.map((r) => (
          <li key={r.label} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ring-1 ${highlight === r.label ? "bg-mango/30 font-bold ring-mango" : "bg-white ring-vanilla-deep"}`}>
            <span>{r.label}</span><span className={r.free ? "font-bold text-forest" : ""}>{r.free ? "FREE" : formatPKR(r.charge)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink/70">We deliver within {max} km of the shop. The charge follows the distance to your pinned location.</p>
    </div>
  );
}