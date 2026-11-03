"use client";
import { useShopStatus } from "@/lib/shopHours";

/** "Shop Online" (green, pulsing) or "Shop Closed" (red) with the next opening/closing time, from the shop timing in lib/shopHours.ts. */
export function ShopStatus({ className = "", showNote = true }: { className?: string; showNote?: boolean }) {
  const s = useShopStatus();
  if (!s) return <span aria-hidden className={`block h-10 w-32 ${className}`} />; // reserves the space until the clock is read
  return (
    <span role="status" aria-label={`${s.open ? "Shop online" : "Shop closed"}. ${s.note}`}
      className={`inline-flex h-10 items-center gap-2.5 rounded-full bg-cream/10 px-3.5 ring-1 ring-cream/15 ${className}`}>
      <span className="relative grid h-2.5 w-2.5 place-items-center">
        {s.open && <span aria-hidden className="absolute h-full w-full animate-ping rounded-full bg-mint/70" />}
        <span aria-hidden className={`relative h-2.5 w-2.5 rounded-full ${s.open ? "bg-mint" : "bg-strawberry"}`} />
      </span>
      <span className="flex flex-col leading-[1.1]">
        <span className="text-[13px] font-bold text-cream">{s.open ? "Shop Online" : "Shop Closed"}</span>
        {showNote && <span className="text-[10px] font-medium tracking-wide text-cream/65">{s.note}</span>}
      </span>
    </span>
  );
}