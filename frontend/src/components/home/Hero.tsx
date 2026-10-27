"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Fraunces } from "next/font/google";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import { SITE } from "@/config/site";
import { formatPKR } from "@/lib/money";
import type { Product } from "@/lib/types";
import { useGetMenuQuery } from "@/store/api";
import shopPhoto1 from "@/assets/cravyshop.webp";

const serif = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], display: "swap" });

/**
 * SHOP PHOTOS: import each file above, then list it here.
 * One photo = static card. Two or more = slow crossfade with progress bars.
 * `position` is the focal point used when the photo is cropped.
 */
const SHOP_PHOTOS = [
  { src: shopPhoto1, alt: "Cravy shop interior with a hand-drawn mural wall", position: "50% 40%" },
  // { src: shopPhoto2, alt: "Cravy storefront at night", position: "50% 38%" },
];

/** The looping discount banner at the top of the section. Edit the text here. */
const DEAL = { percent: 25, note: "Order online for delivery" };

/** Same width and side padding as the navbar, so the edges line up. */
const CONTAINER = "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-6";

const SLIDE_MS = 5500;
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const photo = (p?: Product) =>
  p?.image_url ? (p.image_url.startsWith("http") ? p.image_url : `${API}${p.image_url}`) : null;
const priceOf = (p: Product) =>
  p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : p.base_price;

const EASE = [0.22, 1, 0.36, 1] as const;

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

export function Hero() {
  const reduce = useReducedMotion();
  const { data } = useGetMenuQuery();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (SHOP_PHOTOS.length < 2 || reduce) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % SHOP_PHOTOS.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [reduce]);

  const cats = data?.categories ?? [];
  const all = cats.flatMap((c) => c.products);
  const available = all.filter((p) => p.is_available);
  const pick = [...available].sort((a, b) => Number(b.is_featured) - Number(a.is_featured))[0];
  const pickSrc = photo(pick);
  const startingPrice = available.length ? Math.min(...available.map(priceOf)) : null;
  const unopt = API.includes("localhost");

  const [first, second] = SITE.headline.split(", ");
  const tagline = cats.slice(0, 3).map((c) => c.name).join("  ·  ") || "Ice Creams  ·  Coldies  ·  Margaritas";

  const rise = (d: number) =>
    ({
      initial: reduce ? false : { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.55, delay: d, ease: EASE },
    }) as const;

  const stats = [
    all.length > 0 && { value: `${all.length}`, label: "Menu items" },
    cats.length > 0 && { value: `${cats.length}`, label: "Categories" },
    startingPrice !== null && { value: formatPKR(startingPrice), label: "Starting from" },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <section
      className="relative isolate overflow-hidden rounded-b-[1.5rem] bg-forest text-cream sm:rounded-b-[2rem]"
      style={{ backgroundImage: "radial-gradient(60% 70% at 20% 30%, rgba(15,87,76,.65), transparent 70%)" }}
    >
      <DealMarquee reduce={reduce} />

      <div className={`${CONTAINER} pb-6 pt-8 sm:pb-8 sm:pt-10 lg:pt-12`}>
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {/* Copy */}
          <div className="min-w-0 sm:max-w-2xl lg:max-w-none">
            {/* color: inherit overrides any global heading colour so the cream shows on green */}
            <motion.h1
              {...rise(0.08)}
              style={{ color: "inherit" }}
              className={`${serif.className} text-[clamp(2rem,3.6vw+.6rem,3.9rem)] font-light leading-[1.06] tracking-[-0.02em] text-cream text-balance`}
            >
              {second ? (
                <>
                  {first},
                  <br />
                  <em className="font-normal italic text-mango">{second}</em>
                </>
              ) : (
                SITE.headline
              )}
            </motion.h1>

            <motion.p {...rise(0.16)} className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-cream/75 sm:mt-5 sm:text-base">
              {SITE.description}
            </motion.p>

            <motion.div {...rise(0.24)} className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center sm:gap-7">
              <Link
                href="/menu"
                className="btn group w-full gap-2 bg-cream px-8 text-base text-forest transition-colors duration-300 hover:bg-mango sm:w-auto"
              >
                Order now
                <FiArrowRight aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/menu"
                className="group inline-flex min-h-[44px] items-center justify-center gap-2 text-base font-medium text-cream/85 underline decoration-cream/25 underline-offset-[6px] transition-colors hover:text-cream hover:decoration-mango sm:justify-start"
              >
                View the menu
                <FiArrowRight aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>

            {stats.length > 0 && (
              <motion.dl
                {...rise(0.32)}
                className="mt-8 grid max-w-md grid-cols-3 divide-x divide-cream/15 border-t border-cream/15 pt-4 sm:mt-9 sm:pt-5"
              >
                {stats.map((s, i) => (
                  <div key={s.label} className={`min-w-0 ${i === 0 ? "pr-3 sm:pr-4" : "px-3 sm:px-4"}`}>
                    <dt className="text-[10px] uppercase leading-snug tracking-[.14em] text-cream/55 sm:text-[11px] sm:tracking-[.18em]">
                      {s.label}
                    </dt>
                    <dd className={`${serif.className} mt-1 truncate text-lg leading-none sm:text-xl`}>{s.value}</dd>
                  </div>
                ))}
              </motion.dl>
            )}
          </div>

          {/* Photo card */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="relative aspect-[4/3] w-full min-w-0 overflow-hidden rounded-2xl bg-forest-700 shadow-[0_28px_56px_-26px_rgba(0,0,0,.6)] ring-1 ring-cream/15 sm:aspect-[16/9] lg:aspect-auto lg:h-[26rem] xl:h-[28rem]"
          >
            {SHOP_PHOTOS.map((p, i) => (
              <motion.div
                key={i}
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: i === slide ? 1 : 0, scale: i === slide ? 1 : 1.06 }}
                transition={{
                  opacity: { duration: 1.2, ease: "easeInOut" },
                  scale: { duration: reduce ? 0 : 6, ease: "easeOut" },
                }}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  priority={i === 0}
                  placeholder="blur"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  style={{ objectPosition: p.position }}
                />
              </motion.div>
            ))}

            {/* top and bottom shading keep the overlay text readable on any photo */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent via-35% to-transparent" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 via-50% to-transparent" />

            {/* Category tagline, on top of the photo */}
            <div className="absolute left-3 right-3 top-3 sm:left-5 sm:top-5">
              <p className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-cream/25 bg-forest/60 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-cream backdrop-blur-md sm:text-[11px] sm:tracking-[.22em]">
                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-mango" />
                <span className="truncate">{tagline}</span>
              </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-3 sm:gap-4 sm:p-5">
              <div className="flex items-end justify-between gap-4 px-1">
                <p className={`${serif.className} text-xl italic leading-none text-cream sm:text-2xl`}>Sip. Scoop. Smile.</p>
                {SHOP_PHOTOS.length > 1 && (
                  <div className="flex shrink-0 gap-1.5 pb-0.5" role="tablist" aria-label="Shop photos">
                    {SHOP_PHOTOS.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={i === slide}
                        aria-label={`Show photo ${i + 1}`}
                        onClick={() => setSlide(i)}
                        className={`h-1 rounded-full transition-all duration-500 ${i === slide ? "w-8 bg-mango" : "w-4 bg-cream/40 hover:bg-cream/70"}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {pick && (
                <Link
                  href={`/menu/${pick.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-cream/20 bg-forest/70 p-2 pr-3 backdrop-blur-md transition-colors hover:border-mango/60 hover:bg-forest/85 sm:gap-4 sm:p-2.5 sm:pr-4"
                >
                  {pickSrc && (
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg sm:h-12 sm:w-12">
                      <Image src={pickSrc} alt="" fill sizes="48px" unoptimized={unopt} className="object-cover" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-[.22em] text-mango">
                      {pick.is_featured ? "Featured" : "On the menu"}
                    </span>
                    <span className={`${serif.className} block truncate text-base leading-tight`}>{pick.name}</span>
                    <span className="text-xs text-cream/70">from {formatPKR(priceOf(pick))}</span>
                  </span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cream/25 transition-all duration-300 group-hover:border-mango group-hover:bg-mango group-hover:text-forest">
                    <FiArrowUpRight aria-hidden />
                  </span>
                </Link>
              )}
            </div>
          </motion.div>
        </div>

        {/* Category index */}
        {cats.length > 0 && (
          <motion.nav {...rise(0.4)} aria-label="Menu categories" className="mt-8 border-t border-cream/15 sm:mt-10">
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-cream/15">
              {cats.slice(0, 5).map((c, i) => (
                <li
                  key={c.id}
                  className="min-w-0 max-sm:[&:nth-child(odd):last-child]:col-span-2 lg:px-6 lg:first:pl-0 lg:last:pr-0"
                >
                  <Link href="/menu" className="group flex flex-col gap-0.5 py-3 sm:py-4">
                    <span className="flex items-center justify-between text-[11px] font-semibold tracking-[.2em] text-mango">
                      {String(i + 1).padStart(2, "0")}
                      <FiArrowUpRight aria-hidden className="text-base text-transparent transition-colors group-hover:text-mango" />
                    </span>
                    <span className={`${serif.className} truncate text-lg leading-tight transition-colors group-hover:text-mango sm:text-xl`}>
                      {c.name}
                    </span>
                    <span className="text-xs text-cream/55">
                      {c.products.length} {c.products.length === 1 ? "item" : "items"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </div>
    </section>
  );
}