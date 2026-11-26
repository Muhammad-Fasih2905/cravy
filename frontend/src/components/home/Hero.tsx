"use client";
import { motion, useReducedMotion } from "framer-motion";
import { HeroSlider } from "@/components/home/HeroSlider";
import { SITE } from "@/config/site";
import { useGetSettingsQuery } from "@/store/api";

/** How often an open page asks the server for the announcement. A change made in the admin appears on every open page within this time, no refresh needed. */
const ANNOUNCEMENT_POLL_MS = 10_000;

/** Shown while the admin has not written anything in Admin → Settings → "Announcement bar". */
const DEFAULT_DEAL = { badge: "25% off", note: "Order online for delivery" };

/** What the bar says = the admin's "Announcement bar" text, as written. Optional: "BADGE | message" turns the part before the | into the green pill,
 *  e.g. "30% OFF | Free delivery above Rs. 1500". Without a | the whole text is the message. Empty text = the default above. */
function parseDeal(announcement: string | null | undefined) {
  const text = (announcement ?? "").trim();
  if (!text) return DEFAULT_DEAL;
  const bar = text.indexOf("|");
  if (bar > 0 && bar < text.length - 1) return { badge: text.slice(0, bar).trim(), note: text.slice(bar + 1).trim() };
  return { badge: "", note: text };
}

/** Endless ticker. Two identical tracks slide left by exactly one track width, so the loop has no jump. */
function DealMarquee({ deal, reduce }: { deal: { badge: string; note: string }; reduce: boolean | null }) {
  const { badge, note } = deal;
  // Short text is repeated more often so the track is always wider than a big screen (no empty gap), and the speed stays the same for any text length.
  const itemPx = (badge.length + note.length) * 11 + 100;
  const repeats = Math.max(4, Math.ceil(2600 / itemPx));
  const seconds = Math.max(20, Math.round((repeats * itemPx) / 73));
  const track = (
    <ul aria-hidden className="flex shrink-0 items-center">
      {Array.from({ length: repeats }).map((_, i) => (
        <li key={i} className="flex items-center whitespace-nowrap">
          {badge && <span className="mr-4 rounded-full bg-forest px-3 py-1 font-bold tracking-[.18em] text-mango sm:mr-5">{badge}</span>}
          <span className="font-medium opacity-80">{note}</span>
          <span aria-hidden className="mx-6 inline-block h-1 w-1 rotate-45 bg-forest/60 sm:mx-9" />
        </li>
      ))}
    </ul>
  );

  // key on the ticker: when the admin changes the text, it starts again with the right speed
  return (
    <div className="bg-mango text-forest">
      <p className="sr-only">
        {badge ? `${badge} · ${note}` : note}
      </p>
      <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]">
        <motion.div
          key={`${badge}|${note}`}
          className="flex w-max py-2 text-[10px] font-semibold uppercase tracking-[.2em] sm:py-2.5 sm:text-xs"
          animate={reduce ? undefined : { x: ["0%", "-50%"] }}
          transition={{ duration: seconds, ease: "linear", repeat: Infinity }}
        >
          {track}
          {track}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Home screen top: the looping announcement bar and, below it, the banner slider.
 * The bar text comes from the admin (Settings → "Announcement bar"); the slides are edited in src/config/heroSlides.ts.
 */
export function Hero() {
  const reduce = useReducedMotion();
  // The text is already in the store on first paint (lib/preload.ts); after that it is re-read every few seconds while the page is open and visible,
  // and at once when the tab is focused again or the connection comes back. Same approach as the menu (LiveMenu).
  const { data: settings } = useGetSettingsQuery(undefined, { pollingInterval: ANNOUNCEMENT_POLL_MS, skipPollingIfUnfocused: true, refetchOnFocus: true, refetchOnReconnect: true });
  const deal = parseDeal(settings?.announcement);

  return (
    <section
      className="relative isolate overflow-hidden rounded-b-[1.5rem] bg-forest text-cream sm:rounded-b-[2rem]"
      style={{ backgroundImage: "radial-gradient(60% 70% at 20% 30%, rgba(15,87,76,.65), transparent 70%)" }}
    >
      {/* the page heading stays for search engines and screen readers */}
      <h1 className="sr-only">{SITE.headline}</h1>

      <DealMarquee deal={deal} reduce={reduce} />
      <HeroSlider />
    </section>
  );
}