"use client";
import { motion, useReducedMotion } from "framer-motion";
import { HeroSlider } from "@/components/home/HeroSlider";
import { SITE } from "@/config/site";

/** The looping discount banner at the top of the section. Edit the text here. */
const DEAL = { percent: 25, note: "Order online for delivery" };

/** Endless ticker. Two identical tracks slide left by exactly one track width, so the loop has no jump. */
function DealMarquee({ reduce }: { reduce: boolean | null }) {
  const label = `${DEAL.percent}% off`;
  const track = (
    <ul aria-hidden className="flex shrink-0 items-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center whitespace-nowrap">
          <span className="rounded-full bg-forest px-3 py-1 font-bold tracking-[.18em] text-mango">{label}</span>
          <span className="ml-4 font-medium opacity-80 sm:ml-5">{DEAL.note}</span>
          <span aria-hidden className="mx-6 inline-block h-1 w-1 rotate-45 bg-forest/60 sm:mx-9" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="bg-mango text-forest">
      <p className="sr-only">
        {label} · {DEAL.note}
      </p>
      <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]">
        <motion.div
          className="flex w-max py-2 text-[10px] font-semibold uppercase tracking-[.2em] sm:py-2.5 sm:text-xs"
          animate={reduce ? undefined : { x: ["0%", "-50%"] }}
          transition={{ duration: 36, ease: "linear", repeat: Infinity }}
        >
          {track}
          {track}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Home screen top: the looping discount bar (unchanged) and, below it, the banner slider.
 * The slides are edited in src/config/heroSlides.ts.
 */
export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      className="relative isolate overflow-hidden rounded-b-[1.5rem] bg-forest text-cream sm:rounded-b-[2rem]"
      style={{ backgroundImage: "radial-gradient(60% 70% at 20% 30%, rgba(15,87,76,.65), transparent 70%)" }}
    >
      {/* the page heading stays for search engines and screen readers */}
      <h1 className="sr-only">{SITE.headline}</h1>

      <DealMarquee reduce={reduce} />
      <HeroSlider />
    </section>
  );
}