"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { FiArrowRight, FiCreditCard, FiSmartphone, FiTruck } from "react-icons/fi";
import { GiIceCreamCone } from "react-icons/gi";
import { SITE } from "@/config/site";
import { formatPKR } from "@/lib/money";
import { useGetMenuQuery } from "@/store/api";

const INK = "#0F3D2E";
const CREAM = "#FBF7EE";

/** Each "vibe" re-colours the whole hero: background, text, buttons and the three scoops. */
type Theme = { name: string; bg: string; fg: string; accent: string; accentText: string; scoops: [string, string, string] };
const THEMES: Theme[] = [
  { name: "Classic", bg: "#0F3D2E", fg: CREAM, accent: "#F6B820", accentText: INK, scoops: ["#F26B7F", "#F6B820", "#A8E6CF"] },
  { name: "Strawberry", bg: "#E5384F", fg: CREAM, accent: "#F6B820", accentText: INK, scoops: [CREAM, "#F3E6C4", "#A8E6CF"] },
  { name: "Mango", bg: "#F6B820", fg: INK, accent: INK, accentText: CREAM, scoops: ["#E5384F", CREAM, "#6CCBA6"] },
  { name: "Mint", bg: "#A8E6CF", fg: INK, accent: "#E5384F", accentText: CREAM, scoops: ["#F6B820", "#F26B7F", CREAM] },
];

type Layer = { x: MotionValue<number>; y: MotionValue<number> };
const useLayer = (sx: MotionValue<number>, sy: MotionValue<number>, k: number): Layer => ({
  x: useTransform(sx, [-0.5, 0.5], [-k, k]),
  y: useTransform(sy, [-0.5, 0.5], [-k, k]),
});

/** A parallax layer (follows the pointer) wrapping a gently bobbing child. */
function Float({ m, className, children, reduce, delay = 0, amp = 10 }: { m: Layer; className: string; children: React.ReactNode; reduce: boolean | null; delay?: number; amp?: number }) {
  return (
    <motion.div aria-hidden style={{ x: m.x, y: m.y }} className={`absolute ${className}`}>
      <motion.div animate={reduce ? undefined : { y: [0, -amp, 0], rotate: [-5, 5, -5] }} transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }}>{children}</motion.div>
    </motion.div>
  );
}

function Scoops({ t, reduce }: { t: Theme; reduce: boolean | null }) {
  const id = useId().replace(/:/g, "");
  const c = "transition-colors duration-700";
  const drips: [number, number, number][] = [[150, 268, 30], [212, 288, 24], [248, 272, 44]];
  const sprinkles: [number, number, number, string][] = [[176, 84, -30, "#E5384F"], [206, 72, 20, INK], [228, 98, 60, "#F6B820"], [188, 112, 10, "#6CCBA6"], [214, 120, -40, "#E5384F"], [166, 106, 50, INK]];
  return (
    <svg viewBox="0 0 400 480" aria-hidden className="h-full w-auto drop-shadow-[0_28px_30px_rgba(0,0,0,.28)]">
      <defs><clipPath id={`cone-${id}`}><path d="M128 250 L272 250 L200 452 Z" /></clipPath></defs>
      <g clipPath={`url(#cone-${id})`}>
        <rect x="120" y="245" width="160" height="215" fill="#E9B766" />
        {Array.from({ length: 8 }, (_, i) => 100 + i * 28).map((x) => (
          <g key={x} stroke="#B97B2E" strokeWidth="3"><line x1={x} y1="240" x2={x + 110} y2="470" /><line x1={x} y1="240" x2={x - 110} y2="470" /></g>
        ))}
      </g>
      <path d="M128 250 L272 250 L200 452 Z" fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      {drips.map(([x, y, l], i) => (
        <motion.path key={x} d={`M${x - 9} ${y} v${l} a9 9 0 0 0 18 0 v-${l} Z`} className={c} style={{ fill: t.scoops[0], transformBox: "fill-box", transformOrigin: "50% 0%" }}
          stroke={INK} strokeWidth="5" strokeLinejoin="round" animate={reduce ? undefined : { scaleY: [1, 1.45, 1] }} transition={{ duration: 3.4, repeat: Infinity, delay: i * 0.9, ease: "easeInOut" }} />
      ))}
      <circle cx="200" cy="225" r="72" className={c} style={{ fill: t.scoops[0] }} stroke={INK} strokeWidth="5" />
      <path d="M158 212 Q164 194 186 189" stroke="#fff" strokeOpacity=".6" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="200" cy="160" r="64" className={c} style={{ fill: t.scoops[1] }} stroke={INK} strokeWidth="5" />
      <path d="M160 150 Q167 132 188 127" stroke="#fff" strokeOpacity=".6" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="200" cy="100" r="54" className={c} style={{ fill: t.scoops[2] }} stroke={INK} strokeWidth="5" />
      <path d="M168 92 Q174 78 192 73" stroke="#fff" strokeOpacity=".6" strokeWidth="6" fill="none" strokeLinecap="round" />
      {sprinkles.map(([x, y, r, col]) => <rect key={`${x}-${y}`} x={x - 8} y={y - 3} width="16" height="6" rx="3" fill={col} transform={`rotate(${r} ${x} ${y})`} />)}
      <path d="M200 32 Q 208 14 226 10" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <circle cx="200" cy="40" r="12" fill="#E5384F" stroke={INK} strokeWidth="5" />
    </svg>
  );
}

const Cherry = () => <svg viewBox="0 0 48 56" className="h-12 w-11 sm:h-16 sm:w-14"><path d="M24 30 Q 22 8 40 4" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" /><circle cx="24" cy="38" r="14" fill="#E5384F" stroke={INK} strokeWidth="4" /><ellipse cx="19" cy="33" rx="3.5" ry="2.2" fill="#fff" opacity=".6" /></svg>;
const Leaf = () => <svg viewBox="0 0 48 32" className="h-8 w-12 sm:h-10 sm:w-16"><path d="M3 16 Q 22 -4 45 16 Q 22 36 3 16Z" fill="#6CCBA6" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" /><path d="M8 16 H40" stroke={INK} strokeWidth="2.5" strokeLinecap="round" /></svg>;
const Star = ({ color }: { color: string }) => <svg viewBox="0 0 24 24" className="h-7 w-7 sm:h-9 sm:w-9"><path fill={color} d="M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z" /></svg>;

export function Hero() {
  const reduce = useReducedMotion();
  const { data } = useGetMenuQuery();
  const [idx, setIdx] = useState(0);
  const [touched, setTouched] = useState(false);
  const t = THEMES[idx];

  useEffect(() => { // gentle auto-cycle until the visitor picks a vibe themselves
    if (reduce || touched) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % THEMES.length), 4800);
    return () => clearInterval(timer);
  }, [reduce, touched]);

  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 70, damping: 20 }), sy = useSpring(my, { stiffness: 70, damping: 20 });
  const far = useLayer(sx, sy, 12), mid = useLayer(sx, sy, 28), near = useLayer(sx, sy, 50), word = useLayer(sx, sy, -26);
  const glowX = useTransform(sx, [-0.5, 0.5], [-280, 280]);
  const move = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const all = data?.categories.flatMap((c) => c.products) ?? [];
  const pick = all.filter((p) => p.is_available).sort((a, b) => Number(b.is_featured) - Number(a.is_featured))[0];
  const from = pick ? Math.min(...(pick.variants.length ? pick.variants.map((v) => v.price) : [pick.base_price])) : 0;
  const [first, second] = SITE.headline.split(", ");
  const words = (second ? first : SITE.headline).split(" ");
  const lines = words.map((w, i) => (second && i === words.length - 1 ? `${w},` : w));
  const T = "transition-colors duration-700";

  // A plain function (not a component) so the headline reveal does not replay when the theme changes.
  const line = (key: string, children: React.ReactNode, i: number) => (
    <span key={key} className="block overflow-hidden pb-[0.06em] pt-[0.04em]">
      <motion.span className="block" initial={reduce ? false : { y: "108%" }} animate={{ y: 0 }} transition={{ duration: 0.85, delay: 0.15 + i * 0.12, ease: [0.2, 0.7, 0.2, 1] }}>{children}</motion.span>
    </span>
  );
  const rise = (d: number) => ({ initial: reduce ? false : { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: d } } as const);

  return (
    <section ref={ref} onPointerMove={move} onPointerLeave={() => { mx.set(0); my.set(0); }} className={`relative isolate overflow-hidden pb-24 pt-10 sm:pb-28 sm:pt-14 lg:min-h-[min(92svh,860px)] lg:pb-32 ${T}`} style={{ backgroundColor: t.bg, color: t.fg }}>
      <p className="sr-only" aria-live="polite">Colour theme: {t.name}</p>
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[.07]" style={{ backgroundImage: "radial-gradient(currentColor 1.2px, transparent 1.2px)", backgroundSize: "26px 26px" }} />
      <motion.div aria-hidden style={{ x: glowX }} className="pointer-events-none absolute left-1/2 top-[30%] -z-10 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-white/25 blur-3xl sm:h-[38rem] sm:w-[38rem]" />
      <motion.span aria-hidden style={{ x: word.x, y: word.y, color: t.fg }} className={`pointer-events-none absolute inset-x-0 top-[3%] -z-10 select-none text-center font-display text-[clamp(6.5rem,31vw,27rem)] font-extrabold leading-none tracking-tighter opacity-[.09] ${T}`}>CRAVY</motion.span>

      <div className="mx-auto grid max-w-7xl gap-x-6 gap-y-8 px-5 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:px-12">
        {/* A: eyebrow + headline */}
        <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:self-end">
          <h1 className="mt-5 font-display text-[clamp(3rem,11vw,7rem)] font-extrabold leading-[.9] tracking-tight" style={{ color: "inherit" }}>
            {lines.map((l, i) => line(l, l, i))}
            {second && line("second", <span className={`inline-block -rotate-2 rounded-[1.1rem] px-4 pb-1 shadow-lift ${T}`} style={{ backgroundColor: t.accent, color: t.accentText }}>{second}</span>, lines.length)}
          </h1>
        </div>

        {/* B: the scoop stage */}
        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <motion.div initial={reduce ? false : { opacity: 0, scale: 0.8, rotate: -6 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
            className="relative mx-auto aspect-[4/5] w-full max-w-[290px] min-[420px]:max-w-[340px] sm:max-w-[400px] lg:max-w-[470px]">
            <div aria-hidden className={`absolute inset-x-[4%] bottom-[4%] top-[10%] rounded-full opacity-[.14] ${T}`} style={{ backgroundColor: t.fg }} />
            <div aria-hidden className={`absolute inset-x-[10%] bottom-[10%] top-[16%] rounded-full border-2 border-dashed opacity-30 ${T}`} style={{ borderColor: t.fg }} />
            <motion.div style={{ x: mid.x, y: mid.y }} className="absolute inset-0">
              <motion.div animate={reduce ? undefined : { y: [0, -16, 0], rotate: [-2.5, 2.5, -2.5] }} transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }} className="grid h-full place-items-center py-[1%]"><Scoops t={t} reduce={reduce} /></motion.div>
            </motion.div>

            <Float m={near} reduce={reduce} className="left-[-3%] top-[8%]" amp={12}><Cherry /></Float>
            <Float m={far} reduce={reduce} delay={1} className="right-[0%] top-[52%]" amp={9}><Leaf /></Float>
            <Float m={near} reduce={reduce} delay={2} className="bottom-[14%] left-[-2%]" amp={11}><Star color={t.accent} /></Float>
            <Float m={far} reduce={reduce} delay={0.5} className="left-[20%] top-[-2%]" amp={8}><Star color={t.fg} /></Float>

            <div className="absolute right-[-3%] top-[-1%] h-24 w-24 sm:h-28 sm:w-28" aria-hidden>
              <motion.div animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} className="h-full w-full">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <circle cx="50" cy="50" r="49" className={T} style={{ fill: t.accent }} stroke={INK} strokeWidth="2" />
                  <defs><path id="hero-ring" d="M50 50 m-36 0 a36 36 0 1 1 72 0 a36 36 0 1 1 -72 0" /></defs>
                  <text fontSize="10" fontWeight="800" letterSpacing="1" className={T} style={{ fill: t.accentText }}><textPath href="#hero-ring" textLength="224" lengthAdjust="spacing">ORDER ONLINE • FRESH • CHILLED •</textPath></text>
                </svg>
              </motion.div>
              <span className={`absolute inset-0 grid place-items-center text-3xl sm:text-4xl ${T}`} style={{ color: t.accentText }}><GiIceCreamCone /></span>
            </div>

            {pick && (
              <Link href={`/menu/${pick.slug}`} className="group absolute bottom-[2%] right-[-2%] hidden w-48 rounded-2xl bg-cream p-4 text-ink shadow-lift ring-1 ring-forest/10 transition hover:-translate-y-1 sm:block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-strawberry">{pick.is_featured ? "Featured" : "On the menu"}</span>
                <span className="mt-0.5 block font-display text-lg font-extrabold leading-tight text-forest">{pick.name}</span>
                <span className="mt-1 flex items-center justify-between text-sm">from {formatPKR(from)}<span className="grid h-7 w-7 place-items-center rounded-full bg-forest text-cream transition group-hover:bg-strawberry"><FiArrowRight aria-hidden /></span></span>
              </Link>
            )}
          </motion.div>
        </div>

        {/* C: copy, buttons, vibe picker */}
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <motion.p {...rise(0.5)} className="max-w-md text-base font-medium sm:text-lg" style={{ opacity: 0.92 }}>{SITE.description}</motion.p>
          <motion.div {...rise(0.6)} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/menu" className={`btn group w-full gap-2 text-lg shadow-lift sm:w-auto ${T}`} style={{ backgroundColor: t.accent, color: t.accentText }}>Order Now<FiArrowRight aria-hidden className="transition group-hover:translate-x-1" /></Link>
            <Link href="/menu" className="btn w-full border-2 text-lg hover:bg-white/20 sm:w-auto" style={{ borderColor: "currentColor" }}>Explore Our Menu</Link>
          </motion.div>

          <motion.div {...rise(0.7)} className="mt-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ opacity: 0.75 }}>Pick your vibe</p>
            <div role="radiogroup" aria-label="Pick your vibe" className="flex flex-wrap gap-2">
              {THEMES.map((th, i) => {
                const on = i === idx;
                return (
                  <button key={th.name} role="radio" aria-checked={on} onClick={() => { setTouched(true); setIdx(i); }}
                    className={`flex min-h-[44px] items-center gap-2 rounded-pill p-1.5 pr-4 text-sm font-bold transition ${on ? "" : "hover:bg-white/15"}`}
                    style={on ? { backgroundColor: t.fg, color: t.bg } : { boxShadow: "inset 0 0 0 2px rgba(255,255,255,.35)" }}>
                    <span className="h-8 w-8 rounded-full" style={{ backgroundColor: th.bg, boxShadow: `0 0 0 2px ${on ? t.bg : t.fg}` }} />{th.name}
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.ul {...rise(0.8)} className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
            {([[FiTruck, "Cash on delivery"], [FiSmartphone, "Easypaisa"], [FiCreditCard, "Bank transfer"]] as const).map(([Icon, label]) => (
              <li key={label} className="flex items-center gap-2 rounded-pill bg-white/15 px-3 py-2 ring-1 ring-white/25"><Icon aria-hidden />{label}</li>
            ))}
          </motion.ul>
          {pick && <Link href={`/menu/${pick.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4 sm:hidden">Featured: {pick.name} · from {formatPKR(from)}<FiArrowRight aria-hidden /></Link>}
        </div>
      </div>

      <svg aria-hidden viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute bottom-[-1px] left-0 h-10 w-full sm:h-16" style={{ color: CREAM }}><path fill="currentColor" d="M0 44 C 180 8, 360 8, 540 40 S 900 84, 1080 44 S 1340 8, 1440 36 L1440 80 L0 80 Z" /></svg>
    </section>
  );
}