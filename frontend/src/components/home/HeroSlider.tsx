"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Fraunces } from "next/font/google";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { HERO_SLIDES, type HeroSlide } from "@/config/heroSlides";

const serif = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], display: "swap" });
const AUTOPLAY_MS = 5500;

/** Small original illustrations (Cravy palette) used when a slide has no photo. */
function Art({ kind }: { kind: HeroSlide["art"] }) {
  return (
    <svg viewBox="0 0 240 260" aria-hidden className="h-full w-full">
      {kind === "cone" && (
        <g>
          <path d="M80 130 H160 L120 250 Z" fill="#E2A25A" stroke="#A9692B" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="120" cy="112" r="42" fill="#E63950" />
          <circle cx="120" cy="78" r="36" fill="#A8E6CF" />
          <circle cx="120" cy="48" r="30" fill="#F6B820" />
          <path d="M96 58 q8 14 16 0 q8 14 16 0 q8 14 16 0" fill="none" stroke="#4A2A15" strokeWidth="5" strokeLinecap="round" />
          <circle cx="120" cy="16" r="9" fill="#C81E3A" />
          <path d="M120 8 q4 -10 14 -12" stroke="#6B4423" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}
      {kind === "shake" && (
        <g>
          <path d="M138 20 L112 100" stroke="#E63950" strokeWidth="9" strokeLinecap="round" />
          <path d="M70 70 H170 L158 232 Q156 246 142 246 H98 Q84 246 82 232 Z" fill="#FFB3C4" stroke="#0F574C" strokeWidth="4" strokeLinejoin="round" />
          <rect x="92" y="96" width="10" height="110" rx="5" fill="#fff" opacity=".35" />
          <ellipse cx="120" cy="72" rx="52" ry="14" fill="#FFF6EC" />
          <circle cx="94" cy="58" r="20" fill="#FFF6EC" />
          <circle cx="146" cy="58" r="20" fill="#FFF6EC" />
          <circle cx="120" cy="44" r="20" fill="#FFF6EC" />
          <circle cx="120" cy="24" r="11" fill="#C81E3A" />
        </g>
      )}
      {kind === "cocktail" && (
        <g>
          <path d="M30 60 H210 L120 160 Z" fill="#fff" fillOpacity=".4" stroke="#0F574C" strokeWidth="4" strokeLinejoin="round" />
          <path d="M44 76 H196 L120 158 Z" fill="#9FD43A" />
          <rect x="116" y="158" width="8" height="70" rx="4" fill="#0F574C" />
          <ellipse cx="120" cy="238" rx="48" ry="9" fill="#0F574C" />
          <rect x="24" y="50" width="192" height="12" rx="6" fill="#fff" />
          <g transform="translate(190 62)">
            <circle r="26" fill="#6DBB2E" stroke="#2E7D32" strokeWidth="3" />
            <circle r="19" fill="#DDF58A" />
          </g>
        </g>
      )}
    </svg>
  );
}

/** A photo slide: the picture itself, uncropped, as a link. `first` loads it immediately (it is what the visitor sees first). */
function PhotoSlide({ s, first }: { s: HeroSlide; first: boolean }) {
  const img = s.image!;
  const pic = (src: typeof img, cls: string) => (
    <Image src={src} alt={s.alt ?? ""} fill priority={first} loading={first ? undefined : "lazy"} sizes="100vw" quality={90} draggable={false}
      className={`select-none object-cover ${cls}`} />
  );
  const inner = (
    <>
      {s.mobileImage ? (
        <>
          {pic(s.mobileImage, "sm:hidden")}
          {pic(img, "hidden sm:block")}
        </>
      ) : pic(img, "")}
    </>
  );
  return s.href ? (
    <Link href={s.href} draggable={false} aria-label={s.alt} className="relative block h-full w-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mango">{inner}</Link>
  ) : <div className="relative h-full w-full">{inner}</div>;
}

function SlideView({ s }: { s: HeroSlide }) {
  const light = s.tone === "light";
  const text = light ? "text-cream" : "text-forest";
  return (
    <div className={`relative h-full w-full overflow-hidden ${s.bg ?? "bg-forest"} ${text}`}>
      {(
        <>
          <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="absolute -bottom-10 left-1/3 h-48 w-48 rounded-full bg-black/10 blur-3xl" />
          <div className="absolute inset-y-0 right-0 flex w-[46%] items-center justify-center p-4 sm:w-[44%] sm:p-6 lg:right-[6%] lg:w-[34%]">
            <div className="h-full max-h-[22rem] w-full"><Art kind={s.art ?? "cone"} /></div>
          </div>
        </>
      )}
      <div className={`relative mx-auto flex h-full w-full max-w-7xl items-center px-12 sm:px-16 lg:px-20`}>
        <div className="max-w-[58%] sm:max-w-[52%] lg:max-w-[46%]">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] opacity-80 sm:text-xs">{s.eyebrow}</p>
          <h2 style={{ color: "inherit" }} className={`${serif.className} mt-2 text-[clamp(1.5rem,4.2vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.02em]`}>
            {s.title}<br />
            <em className={`font-normal italic ${light ? "text-mango" : "text-strawberry"}`}>{s.accent}</em>
          </h2>
          <p className="mt-3 hidden max-w-sm text-sm leading-relaxed opacity-85 sm:block lg:text-base">{s.text}</p>
          {s.cta && (
            <Link href={s.cta.href}
              className={`group mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-full px-5 text-sm font-bold transition-colors sm:mt-5 sm:min-h-[44px] sm:text-base ${light ? "bg-cream text-forest hover:bg-mango" : "bg-forest text-cream hover:bg-strawberry"}`}>
              {s.cta.label}<FiArrowRight aria-hidden className="transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Full-width banner slider: edge arrow tabs, swipe/drag, dots, autoplay (pauses on hover/focus), keyboard arrows. */
export function HeroSlider() {
  const reduce = useReducedMotion();
  const n = HERO_SLIDES.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragged = useRef(false);

  const go = useCallback((d: number) => setI((cur) => (cur + d + n) % n), [n]);

  useEffect(() => {
    if (paused || reduce || n < 2) return;
    const t = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, reduce, n, go]);

  if (!n) return null;
  // All slides are photos: the slider is exactly as tall as the picture at that width (no crop, no empty bands, no layout jump).
  // The ratios come from the first slide (desktop picture, and the phone picture below 640px when there is one).
  const photoMode = HERO_SLIDES.every((s) => s.image);
  const first = HERO_SLIDES[0];
  const ratio = (im?: { width: number; height: number }) => (im ? `${im.width} / ${im.height}` : undefined);
  const arVars = photoMode ? ({ "--ar-d": ratio(first.image), "--ar-m": ratio(first.mobileImage ?? first.image) } as React.CSSProperties) : undefined;
  const tab = "absolute top-1/2 z-10 grid h-14 w-8 -translate-y-1/2 place-items-center bg-mango text-xl text-forest shadow-lg transition hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest sm:h-20 sm:w-12 sm:text-3xl";

  return (
    <section
      aria-roledescription="carousel" aria-label="Featured offers" tabIndex={0}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); }}
      className="relative w-full overflow-hidden outline-none"
    >
      <motion.div
        className={`flex cursor-grab touch-pan-y active:cursor-grabbing ${photoMode ? "" : "h-[19rem] sm:h-[22rem] lg:h-[27rem]"}`}
        animate={{ x: `-${i * 100}%` }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32 }}
        drag={n > 1 ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.18}
        onDragStart={() => { dragged.current = true; }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60 || info.velocity.x < -400) go(1);
          else if (info.offset.x > 60 || info.velocity.x > 400) go(-1);
          setTimeout(() => { dragged.current = false; }, 0);
        }}
        onClickCapture={(e) => { if (dragged.current) e.preventDefault(); }} // a swipe must not count as a click on the button
      >
        {HERO_SLIDES.map((s, k) => (
          <div key={s.id} role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${n}`} aria-hidden={k !== i} style={arVars}
            className={`w-full shrink-0 ${photoMode ? "aspect-[var(--ar-m)] sm:aspect-[var(--ar-d)]" : "h-full"}`}>
            {s.image ? <PhotoSlide s={s} first={k === 0} /> : <SlideView s={s} />}
          </div>
        ))}
      </motion.div>

      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className={`${tab} left-0 rounded-r-xl`}><FiChevronLeft aria-hidden /></button>
          <button type="button" onClick={() => go(1)} aria-label="Next slide" className={`${tab} right-0 rounded-l-xl`}><FiChevronRight aria-hidden /></button>
          <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
            {HERO_SLIDES.map((s, k) => (
              <button key={s.id} type="button" onClick={() => setI(k)} aria-label={`Go to slide ${k + 1}`} aria-current={k === i}
                className={`h-2.5 rounded-full transition-all ${k === i ? "w-7 bg-cream" : "w-2.5 bg-cream/60 hover:bg-cream"} ring-1 ring-forest/40`} />
            ))}
          </div>
        </>
      )}
      <p className="sr-only" aria-live="polite">Slide {i + 1} of {n}: {HERO_SLIDES[i].alt ?? `${HERO_SLIDES[i].title ?? ""} ${HERO_SLIDES[i].accent ?? ""}`}</p>
    </section>
  );
}