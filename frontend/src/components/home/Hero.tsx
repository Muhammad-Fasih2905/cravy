"use client";
import { useId } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Fraunces } from "next/font/google";
import { FiArrowRight } from "react-icons/fi";
import { SITE } from "@/config/site";
import { formatPKR } from "@/lib/money";
import type { Product } from "@/lib/types";
import { useGetMenuQuery } from "@/store/api";

const serif = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], display: "swap" });

/** The looping discount banner at the top of the section. Edit the text here. */
const DEAL = { percent: 25, note: "Order online for delivery" };

/** Same width and side padding as the navbar, so the edges line up. */
const CONTAINER = "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-6";

const priceOf = (p: Product) =>
  p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : p.base_price;

const EASE = [0.22, 1, 0.36, 1] as const;

// Brand palette used inside the illustration (matches the menu cards below the hero).
const RED = "#E63950";
const MINT = "#A8E6CF";
const MANGO = "#F6B820";
const DEEP = "#0F574C";

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

// [x, y, rotation, colour]: sprinkles scattered over the three scoops (cone-local coordinates)
const SPRINKLES: [number, number, number, string][] = [
  [128, 86, 20, RED], [150, 72, -30, MINT], [182, 92, 40, "#fff"], [196, 100, -15, DEEP],
  [122, 128, -25, "#fff"], [146, 118, 35, RED], [172, 134, -10, MANGO], [198, 124, 50, DEEP], [160, 146, 15, RED],
  [112, 178, 30, "#fff"], [138, 168, -20, MANGO], [168, 184, 45, "#fff"], [196, 170, -35, MINT], [210, 190, 10, MANGO], [128, 198, -45, DEEP],
];

// four-point sparkle
const STAR = "M0 -9 Q1.5 -1.5 9 0 Q1.5 1.5 0 9 Q-1.5 1.5 -9 0 Q-1.5 -1.5 0 -9Z";
const SPARKLES: [number, number, number, number][] = [
  [92, 70, 1, 0], [440, 96, 0.8, 0.7], [58, 218, 0.7, 1.4], [468, 250, 1, 2.1], [250, 18, 0.7, 1.1],
];
const BUBBLES: [number, number, number, number][] = [
  [128, 150, 5, 0], [404, 190, 4, 1.2], [96, 330, 3.5, 2.2], [430, 392, 4.5, 0.6],
];

/** Original vector illustration: a loaded cone with a chocolate drizzle, a milkshake and a margarita. */
function IceCreamArt({ reduce }: { reduce: boolean | null }) {
  const id = useId().replace(/:/g, "");
  const u = (n: string) => `${n}-${id}`;
  const float = (dy: number, dur: number, delay = 0) =>
    reduce
      ? {}
      : {
          animate: { y: [0, -dy, 0] },
          transition: { duration: dur, repeat: Infinity, ease: "easeInOut" as const, delay },
        };

  return (
    <svg viewBox="0 0 520 460" aria-hidden className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id={u("red")} cx=".32" cy=".25" r=".95">
          <stop offset="0" stopColor="#FF8FA0" />
          <stop offset=".5" stopColor={RED} />
          <stop offset="1" stopColor="#A91B34" />
        </radialGradient>
        <radialGradient id={u("mint")} cx=".32" cy=".25" r=".95">
          <stop offset="0" stopColor="#E4FFF2" />
          <stop offset=".5" stopColor={MINT} />
          <stop offset="1" stopColor="#5DB896" />
        </radialGradient>
        <radialGradient id={u("mango")} cx=".32" cy=".25" r=".95">
          <stop offset="0" stopColor="#FFE9A3" />
          <stop offset=".5" stopColor={MANGO} />
          <stop offset="1" stopColor="#CC8A08" />
        </radialGradient>
        <linearGradient id={u("choc")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8A5530" />
          <stop offset="1" stopColor="#4A2A15" />
        </linearGradient>
        <linearGradient id={u("cone")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F0B766" />
          <stop offset="1" stopColor="#C9803A" />
        </linearGradient>
        <linearGradient id={u("shake")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB3C4" />
          <stop offset="1" stopColor="#F0577F" />
        </linearGradient>
        <linearGradient id={u("lime")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E3F98A" />
          <stop offset="1" stopColor="#9FD43A" />
        </linearGradient>
        <clipPath id={u("coneclip")}>
          <path d="M96 236 L224 236 L160 424 Z" />
        </clipPath>
        <clipPath id={u("topdome")}>
          <path d="M112 100 A48 48 0 0 1 208 100 Z" />
        </clipPath>
        <clipPath id={u("shakeclip")}>
          <path d="M4 62 H76 L68 160 Q66 170 56 170 H24 Q14 170 12 160 Z" />
        </clipPath>
        <clipPath id={u("limeclip")}>
          <path d="M10 14 H90 L50 56 Z" />
        </clipPath>
      </defs>

      {/* ground shadow */}
      <motion.ellipse
        cx="260" cy="448" rx="64" ry="7" fill="#000"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        animate={reduce ? { opacity: 0.25 } : { scaleX: [1, 0.8, 1], opacity: [0.3, 0.14, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* sparkles and bubbles */}
      {SPARKLES.map(([x, y, s, d], i) => (
        <motion.path
          key={`s${i}`} d={STAR} fill="#FAF5EE" transform={`translate(${x} ${y}) scale(${s})`}
          animate={reduce ? { opacity: 0.7 } : { opacity: [0.15, 1, 0.15] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: d, ease: "easeInOut" }}
        />
      ))}
      {BUBBLES.map(([x, y, r, d], i) => (
        <motion.circle
          key={`b${i}`} cx={x} cy={y} r={r} fill="none" stroke="#FAF5EE" strokeWidth="1.2"
          animate={reduce ? { opacity: 0.35 } : { y: [0, -16, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: d, ease: "easeInOut" }}
        />
      ))}

      {/* margarita (left) */}
      <g transform="translate(26 262) scale(.95)">
        <motion.g {...float(7, 4.4, 0.4)}>
          <rect x="47" y="56" width="6" height="52" rx="3" fill="#fff" opacity=".55" />
          <ellipse cx="50" cy="110" rx="28" ry="6" fill="#fff" opacity=".5" />
          <path d="M0 0 H100 L50 60 Z" fill="#fff" opacity=".16" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeLinejoin="round" />
          <g clipPath={`url(#${u("limeclip")})`}>
            <rect x="0" y="14" width="100" height="50" fill={`url(#${u("lime")})`} />
          </g>
          <rect x="-2" y="-5" width="104" height="8" rx="4" fill="#fff" opacity=".92" />
          {[8, 22, 36, 52, 66, 80, 92].map((x) => (
            <circle key={x} cx={x} cy={-1} r="1.2" fill="#BFD7D0" />
          ))}
          <g transform="translate(86 6)">
            <circle r="17" fill="#6DBB2E" stroke="#2E7D32" strokeWidth="2" />
            <circle r="13" fill="#DDF58A" />
            {[0, 60, 120].map((a) => (
              <line key={a} x1="0" y1="-13" x2="0" y2="13" stroke="#6DBB2E" strokeWidth="1.5" transform={`rotate(${a})`} />
            ))}
          </g>
        </motion.g>
      </g>

      {/* milkshake (right) */}
      <g transform="translate(392 252) scale(.95)">
        <motion.g {...float(8, 4.8, 1)}>
          <line x1="52" y1="70" x2="82" y2="-34" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
          <line x1="52" y1="70" x2="82" y2="-34" stroke={RED} strokeWidth="8" strokeLinecap="round" strokeDasharray="7 7" />
          <path d="M0 40 H80 L68 160 Q66 170 56 170 H24 Q14 170 12 160 Z" fill="#fff" opacity=".14" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeLinejoin="round" />
          <g clipPath={`url(#${u("shakeclip")})`}>
            <rect x="0" y="60" width="80" height="115" fill={`url(#${u("shake")})`} />
            <rect x="16" y="70" width="8" height="90" rx="4" fill="#fff" opacity=".25" />
          </g>
          <ellipse cx="40" cy="42" rx="40" ry="10" fill="#FFF6EC" />
          <circle cx="26" cy="32" r="15" fill="#FFF6EC" />
          <circle cx="54" cy="32" r="15" fill="#FFF6EC" />
          <circle cx="40" cy="20" r="14" fill="#FFF6EC" />
          <circle cx="40" cy="8" r="8" fill="#C81E3A" />
          <circle cx="37" cy="5" r="2.4" fill="#fff" opacity=".65" />
        </motion.g>
      </g>

      {/* the hero cone */}
      <g transform="translate(100 0)">
        <motion.g
          {...(reduce ? {} : { animate: { y: [0, -10, 0], rotate: [-1.2, 1.2, -1.2] }, transition: { duration: 5, repeat: Infinity, ease: "easeInOut" } })}
          style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
        >
          {/* cone */}
          <path d="M96 236 L224 236 L160 424 Z" fill={`url(#${u("cone")})`} stroke="#A9692B" strokeWidth="2" strokeLinejoin="round" />
          <g clipPath={`url(#${u("coneclip")})`}>
            <g stroke="#A9692B" strokeWidth="2" opacity=".7">
              {Array.from({ length: 8 }).map((_, i) => (
                <g key={i}>
                  <line x1={60 + i * 26} y1="236" x2={150 + i * 26} y2="440" />
                  <line x1={260 - i * 26} y1="236" x2={170 - i * 26} y2="440" />
                </g>
              ))}
            </g>
            <path d="M160 236 L224 236 L160 424 Z" fill="#000" opacity=".12" />
          </g>
          <rect x="88" y="226" width="144" height="18" rx="9" fill="#EDB366" stroke="#A9692B" strokeWidth="2" />
          <rect x="94" y="229" width="60" height="4" rx="2" fill="#fff" opacity=".35" />

          {/* bottom scoop */}
          <path
            d="M95 196 A65 65 0 0 1 225 196 V214 q-13 18 -26 0 q-13 18 -26 0 q-13 18 -26 0 q-13 18 -26 0 q-13 18 -26 0 Z"
            fill={`url(#${u("red")})`} stroke="rgba(0,0,0,.16)" strokeWidth="1.5"
          />
          <ellipse cx="122" cy="160" rx="11" ry="6" fill="#fff" opacity=".4" transform="rotate(-35 122 160)" />

          {/* middle scoop */}
          <path
            d="M102 150 A58 58 0 0 1 218 150 V166 q-14.5 18 -29 0 q-14.5 18 -29 0 q-14.5 18 -29 0 q-14.5 18 -29 0 Z"
            fill={`url(#${u("mint")})`} stroke="rgba(0,0,0,.12)" strokeWidth="1.5"
          />
          <ellipse cx="127" cy="116" rx="10" ry="5.5" fill="#fff" opacity=".55" transform="rotate(-35 127 116)" />

          {/* wafer stick, tucked behind the top scoop */}
          <g transform="translate(192 98) rotate(26)">
            <rect x="-8" y="-84" width="16" height="84" rx="3" fill="#F1D08F" stroke="#C9A25E" strokeWidth="1.5" />
            {[-70, -56, -42, -28, -14].map((y) => (
              <line key={y} x1="-8" y1={y} x2="8" y2={y} stroke="#C9A25E" strokeWidth="1.2" />
            ))}
          </g>

          {/* top scoop with chocolate drizzle */}
          <path
            d="M112 100 A48 48 0 0 1 208 100 V114 q-12 16 -24 0 q-12 16 -24 0 q-12 16 -24 0 q-12 16 -24 0 Z"
            fill={`url(#${u("mango")})`} stroke="rgba(0,0,0,.12)" strokeWidth="1.5"
          />
          <g clipPath={`url(#${u("topdome")})`}>
            <path
              d="M104 40 H216 V80 q-7 22 -14 0 q-6 14 -12 0 q-8 30 -16 0 q-6.5 18 -13 0 q-7.5 26 -15 0 q-7 16 -14 0 q-7 24 -14 0 q-7 12 -14 0 Z"
              fill={`url(#${u("choc")})`}
            />
            <ellipse cx="138" cy="62" rx="10" ry="3.5" fill="#fff" opacity=".28" transform="rotate(-20 138 62)" />
          </g>
          <ellipse cx="190" cy="104" rx="7" ry="4" fill="#fff" opacity=".4" transform="rotate(-35 190 104)" />

          {SPRINKLES.map(([x, y, r, c], i) => (
            <rect key={i} x="-5" y="-1.8" width="10" height="3.6" rx="1.8" fill={c} transform={`translate(${x} ${y}) rotate(${r})`} />
          ))}

          {/* cherry */}
          <path d="M160 38 Q166 20 184 14" fill="none" stroke="#6B4423" strokeWidth="3" strokeLinecap="round" />
          <circle cx="160" cy="46" r="12" fill="#C81E3A" />
          <circle cx="156" cy="42" r="3.2" fill="#fff" opacity=".65" />
        </motion.g>
      </g>
    </svg>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const { data } = useGetMenuQuery();

  const cats = data?.categories ?? [];
  const all = cats.flatMap((c) => c.products);
  const available = all.filter((p) => p.is_available);
  const startingPrice = available.length ? Math.min(...available.map(priceOf)) : null;

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
      {/* soft colour glows for depth */}
      <div aria-hidden className="pointer-events-none absolute -left-24 top-40 -z-10 h-72 w-72 rounded-full bg-mango/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-80 w-80 rounded-full bg-[#A8E6CF]/10 blur-3xl" />

      <DealMarquee reduce={reduce} />

      <div className={`${CONTAINER} pb-10 pt-8 sm:pb-12 sm:pt-10 lg:pt-12`}>
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

          {/* Ice cream stage */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="relative mx-auto aspect-[5/6] w-full min-w-0 max-w-[30rem] overflow-hidden rounded-2xl bg-forest-700 shadow-[0_28px_56px_-26px_rgba(0,0,0,.6)] ring-1 ring-cream/15 sm:aspect-[16/11] sm:max-w-none lg:aspect-auto lg:h-[28rem] xl:h-[30rem]"
            style={{
              backgroundImage:
                "radial-gradient(55% 55% at 50% 48%, rgba(246,184,32,.28), transparent 70%), radial-gradient(90% 70% at 50% 115%, rgba(0,0,0,.35), transparent 70%)",
            }}
          >
            {/* concentric rings behind the art */}
            <div aria-hidden className="absolute left-1/2 top-[48%] aspect-square h-[96%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream/10" />
            <div aria-hidden className="absolute left-1/2 top-[48%] aspect-square h-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-mango/25" />

            {/* the ice cream */}
            <div className="absolute inset-x-3 bottom-11 top-14 sm:inset-x-6 sm:bottom-14 sm:top-16">
              <IceCreamArt reduce={reduce} />
            </div>

            {/* discount sticker */}
            <motion.div
              aria-hidden
              className="absolute right-3 top-3 grid h-16 w-16 place-items-center rounded-full bg-mango text-forest shadow-lg ring-4 ring-mango/25 sm:right-5 sm:top-5 sm:h-20 sm:w-20"
              initial={{ rotate: 10 }}
              animate={reduce ? undefined : { rotate: [8, 16, 8] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-center leading-none">
                <span className={`${serif.className} block text-xl font-semibold sm:text-2xl`}>{DEAL.percent}%</span>
                <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[.2em] sm:text-[10px]">off</span>
              </span>
            </motion.div>

            {/* slogan */}
            <p className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3 sm:bottom-5">
              <span aria-hidden className="h-px w-8 bg-cream/25 sm:w-12" />
              <span className={`${serif.className} text-lg italic leading-none text-cream/90 sm:text-xl`}>Sip. Scoop. Smile.</span>
              <span aria-hidden className="h-px w-8 bg-cream/25 sm:w-12" />
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}