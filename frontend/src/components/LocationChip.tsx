"use client";
import { useMemo, useSyncExternalStore } from "react";
import { FiChevronDown, FiMapPin } from "react-icons/fi";
import { estimateDelivery, openLocationModal, useSavedLocation, type Estimate } from "@/lib/location";
import { formatPKR } from "@/lib/money";
import { useGetDeliveryRatesQuery } from "@/store/api";

/** False on the server and during hydration, true afterwards: avoids a flash of "Set your location" for returning visitors. */
const useMounted = () => useSyncExternalStore(() => () => {}, () => true, () => false);

export function deliveryNote(est: Estimate | null): { text: string; bad: boolean } | null {
  if (!est) return null;
  if (!est.inRange) return { text: `${est.km.toFixed(1)} km away · outside our delivery range`, bad: true };
  return { text: `${est.km.toFixed(1)} km · ${est.charge === 0 ? "Free delivery" : `${formatPKR(est.charge ?? 0)} delivery`}`, bad: false };
}

function useChipData() {
  const mounted = useMounted();
  const saved = useSavedLocation();
  const { data } = useGetDeliveryRatesQuery();
  const est = useMemo(() => (saved && saved.latitude != null && saved.longitude != null ? estimateDelivery(saved.latitude, saved.longitude, data?.rates) : null), [saved, data]);
  return { mounted, saved: mounted ? saved : null, est: mounted ? est : null };
}

/**
 * The navbar button. It is always exactly as tall as the other navbar buttons (44px, 48px from 640px) and never grows:
 * pin icon + two short lines of text, and on wide screens a small price badge. Tapping it reopens the location popup.
 */
export function LocationChip() {
  const { mounted, saved, est } = useChipData();
  if (!mounted) return <span aria-hidden className="block h-11 w-11 sm:h-12 sm:w-12" />; // reserves the space
  const place = saved ? `${saved.area}, ${saved.city}` : null;
  const fee = est ? (est.inRange ? (est.charge === 0 ? "FREE" : formatPKR(est.charge ?? 0)) : "Out of range") : null;
  return (
    <button type="button" onClick={() => openLocationModal()} aria-haspopup="dialog"
      aria-label={place ? `Delivery to ${place}${fee ? `, ${fee}` : ""}. Change location` : "Set your delivery location"}
      className="group flex h-11 min-w-0 max-w-full items-center gap-2 rounded-full bg-cream/10 pr-1 ring-1 ring-cream/15 transition hover:bg-cream/[.16] hover:ring-mango/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mango min-[400px]:pr-3 sm:h-12">
      <span className="relative grid h-11 w-11 shrink-0 place-items-center sm:h-12 sm:w-12">
        {!saved && <span aria-hidden className="absolute h-8 w-8 animate-ping rounded-full bg-mango/40" />}
        <span className="relative grid h-8 w-8 place-items-center rounded-full bg-mango text-base text-forest transition group-hover:scale-110 sm:h-9 sm:w-9 sm:text-lg"><FiMapPin aria-hidden /></span>
      </span>
      <span className="hidden min-w-0 flex-col justify-center text-left leading-[1.15] min-[400px]:flex md:hidden lg:flex">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.14em] text-mango">{saved ? "Delivery to" : "Delivery"}<FiChevronDown aria-hidden className="text-xs transition group-hover:translate-y-0.5" /></span>
        <span className="block max-w-[8.5rem] truncate text-[13px] font-semibold text-cream min-[400px]:max-w-[9.5rem] sm:max-w-[13rem] lg:max-w-[12rem] xl:max-w-[14rem]">{place ?? "Set your location"}</span>
      </span>
      {fee && (
        <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-bold xl:inline-flex ${est && !est.inRange ? "bg-strawberry text-cream" : "bg-mango text-forest"}`}>{fee}</span>
      )}
    </button>
  );
}

/** Full-width version for the mobile menu, where there is room to show the whole area name. */
export function LocationRow({ onNavigate }: { onNavigate?: () => void }) {
  const { mounted, saved, est } = useChipData();
  if (!mounted) return null;
  const note = deliveryNote(est);
  return (
    <button type="button" onClick={() => { onNavigate?.(); openLocationModal(); }}
      className="flex w-full items-center gap-3 rounded-2xl bg-cream/10 p-3.5 text-left ring-1 ring-cream/15 transition hover:bg-cream/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mango">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mango text-lg text-forest"><FiMapPin aria-hidden /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-[.16em] text-mango">{saved ? "Delivering to" : "Delivery location"}</span>
        <span className="block truncate font-semibold text-cream">{saved ? `${saved.area}, ${saved.city}` : "Tap to set your location"}</span>
        {note && <span className={`block truncate text-xs ${note.bad ? "text-[#ffb3bd]" : "text-cream/70"}`}>{note.text}</span>}
      </span>
      <span className="shrink-0 text-sm font-semibold text-mango">{saved ? "Change" : "Set"}</span>
    </button>
  );
}