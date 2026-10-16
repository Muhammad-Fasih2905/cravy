"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FiArrowRight, FiCreditCard, FiSmartphone, FiTruck } from "react-icons/fi";
import { GiIceCreamCone } from "react-icons/gi";
import { SITE } from "@/config/site";
import { formatPKR } from "@/lib/money";
import type { Product } from "@/lib/types";
import { useGetMenuQuery } from "@/store/api";

const INK = "#0F3D2E";
const container = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } } };

const fromPrice = (p: Product) => Math.min(...(p.variants.length ? p.variants.map((v) => v.price) : [p.base_price]));

/** Hand-drawn style triple scoop cone: bold outlines, flat brand colours. Pure SVG, no image files needed. */
function Cone() {
    const drips: [number, number, number][] = [[150, 268, 30], [212, 288, 24], [248, 272, 44]];
    const sprinkles: [number, number, number, string][] = [[176, 84, -30, "#E5384F"], [206, 72, 20, INK], [228, 98, 60, "#F6B820"], [188, 112, 10, "#6CCBA6"], [214, 120, -40, "#E5384F"], [166, 106, 50, INK]];
    return (
        <svg viewBox="0 0 400 480" aria-hidden className="h-full w-auto drop-shadow-[0_24px_28px_rgba(10,42,32,.35)]">
            <defs><clipPath id="cone-clip"><path d="M128 250 L272 250 L200 452 Z" /></clipPath></defs>
            <g clipPath="url(#cone-clip)">
                <rect x="120" y="245" width="160" height="215" fill="#EFC27A" />
                {Array.from({ length: 8 }, (_, i) => 100 + i * 28).map((x) => (
                    <g key={x} stroke="#C98F3E" strokeWidth="3"><line x1={x} y1="240" x2={x + 110} y2="470" /><line x1={x} y1="240" x2={x - 110} y2="470" /></g>
                ))}
            </g>
            <path d="M128 250 L272 250 L200 452 Z" fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
            {drips.map(([x, y, l]) => <path key={x} d={`M${x - 9} ${y} v${l} a9 9 0 0 0 18 0 v-${l} Z`} fill="#F26B7F" stroke={INK} strokeWidth="5" strokeLinejoin="round" />)}
            <circle cx="200" cy="225" r="72" fill="#F26B7F" stroke={INK} strokeWidth="5" />
            <ellipse cx="170" cy="240" rx="14" ry="8" fill="#fff" opacity=".4" transform="rotate(-30 170 240)" />
            <circle cx="200" cy="160" r="64" fill="#A8E6CF" stroke={INK} strokeWidth="5" />
            <ellipse cx="172" cy="170" rx="14" ry="8" fill="#fff" opacity=".45" transform="rotate(-30 172 170)" />
            <circle cx="200" cy="100" r="54" fill="#FBF7EE" stroke={INK} strokeWidth="5" />
            <ellipse cx="178" cy="108" rx="12" ry="7" fill="#F3E6C4" transform="rotate(-30 178 108)" />
            {sprinkles.map(([x, y, r, c]) => <rect key={`${x}-${y}`} x={x - 8} y={y - 3} width="16" height="6" rx="3" fill={c} transform={`rotate(${r} ${x} ${y})`} />)}
            <path d="M200 32 Q 208 14 226 10" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
            <circle cx="200" cy="40" r="12" fill="#E5384F" stroke={INK} strokeWidth="5" />
        </svg>
    );
}

function Spark({ className, delay = 0, reduce }: { className: string; delay?: number; reduce: boolean | null }) {
    return (
        <motion.svg aria-hidden viewBox="0 0 24 24" className={`absolute ${className}`} animate={reduce ? undefined : { scale: [0.7, 1.15, 0.7], rotate: [0, 45, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, delay, ease: "easeInOut" }}>
            <path fill="currentColor" d="M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z" />
        </motion.svg>
    );
}

function PickCard({ p, className = "" }: { p: Product; className?: string }) {
    return (
        <Link href={`/menu/${p.slug}`} className={`group block rounded-2xl bg-cream p-3 text-ink shadow-lift ring-1 ring-forest/10 transition hover:-translate-y-1 sm:p-4 ${className}`}>
            <span className="text-[11px] font-bold uppercase tracking-wider text-strawberry">{p.is_featured ? "Featured" : "On the menu"}</span>
            <span className="mt-0.5 block font-display text-base font-extrabold leading-tight text-forest sm:text-lg">{p.name}</span>
            <span className="mt-1 flex items-center justify-between text-sm">from {formatPKR(fromPrice(p))}
                <span className="grid h-7 w-7 place-items-center rounded-full bg-forest text-cream transition group-hover:bg-strawberry"><FiArrowRight aria-hidden /></span>
            </span>
        </Link>
    );
}

export function Hero() {
    const reduce = useReducedMotion();
    const { data } = useGetMenuQuery();
    const all = data?.categories.flatMap((c) => c.products) ?? [];
    const picks = all.filter((p) => p.is_available).sort((a, b) => Number(b.is_featured) - Number(a.is_featured)).slice(0, 2);
    const [first, second] = SITE.headline.split(", ");

    return (
        <section className="bg-cream px-3 pb-14 pt-3 sm:px-5 sm:pt-5">
            <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] bg-forest px-5 py-10 text-cream sm:rounded-[2.5rem] sm:px-10 sm:py-14 lg:px-16 lg:py-16"
                style={{ backgroundImage: "radial-gradient(55% 55% at 90% 10%, rgba(246,184,32,.28), transparent 60%), radial-gradient(45% 45% at 0% 100%, rgba(168,230,207,.18), transparent 60%)" }}>
                <div aria-hidden className="absolute inset-0 -z-10 opacity-[.06]" style={{ backgroundImage: "radial-gradient(#fff 1.2px, transparent 1.2px)", backgroundSize: "24px 24px" }} />
                <div aria-hidden className="absolute -right-32 top-1/2 -z-10 hidden h-[40rem] w-[40rem] -translate-y-1/2 rounded-full border border-cream/10 lg:block" />
                <div aria-hidden className="absolute -right-12 top-1/2 -z-10 hidden h-[28rem] w-[28rem] -translate-y-1/2 rounded-full border border-cream/10 lg:block" />

                <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-6">
                    <motion.div variants={container} initial="hidden" animate="show" className="min-w-0">
                        <motion.p variants={item} className="inline-flex max-w-full items-center gap-2 rounded-pill bg-cream/10 px-4 py-2 text-xs font-semibold ring-1 ring-cream/20 sm:text-sm">
                            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-mango" />
                            <span className="truncate">{data?.categories.map((c) => c.name).slice(0, 4).join(" · ") || "Ice creams · Shakes · Mocktails"}</span>
                        </motion.p>

                        <motion.h1 variants={item} className="mt-5 text-balance font-display text-[clamp(2.4rem,9vw,5.25rem)] font-extrabold leading-[.98] tracking-tight !text-cream">
                            {second ? <>{first},{" "}<span className="mt-1 inline-block -rotate-2 rounded-2xl bg-mango px-3 py-1 text-forest shadow-lift">{second}</span></> : SITE.headline}
                        </motion.h1>

                        <motion.p variants={item} className="mt-6 max-w-md text-base text-cream/85 sm:text-lg">{SITE.description}</motion.p>

                        <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link href="/menu" className="btn group w-full gap-2 bg-mango text-lg text-forest shadow-lift transition hover:bg-vanilla sm:w-auto">Order Now<FiArrowRight aria-hidden className="transition group-hover:translate-x-1" /></Link>
                            <Link href="/menu" className="btn w-full border-2 border-cream/70 text-lg text-cream hover:bg-cream hover:text-forest sm:w-auto">Explore Our Menu</Link>
                        </motion.div>

                        <motion.ul variants={item} className="mt-8 flex flex-wrap gap-2 text-sm font-semibold">
                            {[[FiTruck, "Cash on delivery"], [FiSmartphone, "Easypaisa"], [FiCreditCard, "Bank transfer"]].map(([Icon, t]) => {
                                const I = Icon as typeof FiTruck;
                                return <li key={t as string} className="flex items-center gap-2 rounded-pill bg-cream/10 px-3 py-2 ring-1 ring-cream/15"><I aria-hidden className="text-mango" />{t as string}</li>;
                            })}
                        </motion.ul>
                        {all.length > 0 && <motion.p variants={item} className="mt-4 text-sm text-cream/70">{all.length}+ items across {data?.categories.length} categories</motion.p>}
                    </motion.div>

                    <div className="min-w-0">
                        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
                            className="relative mx-auto aspect-square w-full max-w-[320px] min-[420px]:max-w-[380px] sm:max-w-[440px] lg:max-w-[500px]">
                            <div aria-hidden className="absolute inset-[4%] rounded-full bg-mango" />
                            <div aria-hidden className="absolute inset-[12%] rounded-full border-2 border-dashed border-forest/30" />
                            <motion.div animate={reduce ? undefined : { y: [0, -14, 0], rotate: [-2, 2, -2] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 grid place-items-center py-[2%]"><Cone /></motion.div>

                            <Spark reduce={reduce} className="left-[6%] top-[12%] h-7 w-7 text-cream sm:h-9 sm:w-9" />
                            <Spark reduce={reduce} delay={1} className="bottom-[22%] left-[2%] h-5 w-5 text-mint sm:h-6 sm:w-6" />
                            <Spark reduce={reduce} delay={2} className="bottom-[12%] right-[10%] h-6 w-6 text-strawberry sm:h-8 sm:w-8" />

                            <div className="absolute right-[-2%] top-[2%] h-24 w-24 sm:h-28 sm:w-28" aria-hidden>
                                <motion.div animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} className="h-full w-full">
                                    <svg viewBox="0 0 100 100" className="h-full w-full">
                                        <circle cx="50" cy="50" r="49" fill="#FBF7EE" stroke={INK} strokeWidth="2" />
                                        <defs><path id="hero-ring" d="M50 50 m-37 0 a37 37 0 1 1 74 0 a37 37 0 1 1 -74 0" /></defs>
                                        <text fontSize="10.5" fontWeight="800" fill={INK} letterSpacing="1.5"><textPath href="#hero-ring" textLength="228" lengthAdjust="spacing">FRESH • CHILLED • CRAVY • FRESH •</textPath></text>
                                    </svg>
                                </motion.div>
                                <span className="absolute inset-0 grid place-items-center text-3xl text-strawberry sm:text-4xl"><GiIceCreamCone /></span>
                            </div>

                            {picks[0] && <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }} className="absolute bottom-[4%] left-0 hidden w-44 sm:block lg:w-48"><PickCard p={picks[0]} /></motion.div>}
                            {picks[1] && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 }} className="absolute right-0 top-[44%] hidden w-40 sm:block lg:w-44"><PickCard p={picks[1]} /></motion.div>}
                        </motion.div>

                        {picks.length > 0 && (
                            <div className="mx-auto mt-6 grid max-w-[380px] grid-cols-2 gap-3 sm:hidden">{picks.map((p) => <PickCard key={p.id} p={p} />)}</div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}