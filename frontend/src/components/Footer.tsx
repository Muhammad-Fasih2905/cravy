"use client";
import Link from "next/link";
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FiArrowUp, FiArrowUpRight, FiCreditCard, FiPhone, FiShield, FiSmartphone, FiTruck } from "react-icons/fi";
import { Logo } from "@/components/brand/Logo";
import { Reveal } from "@/components/Reveal";
import { SITE } from "@/config/site";
import { useGetMenuQuery, useGetSettingsQuery } from "@/store/api";

const LETTER_COLORS = ["#F6B820", "#E5384F", "#A8E6CF", "#F3E6C4", "#F26B7F"];

/** Round "Order now" button with a slowly turning text ring. */
function OrderDisc({ reduce }: { reduce: boolean | null }) {
  const id = useId().replace(/:/g, "");
  return (
    <Link href="/menu" aria-label="Order now" className="group relative grid h-36 w-36 shrink-0 place-items-center rounded-full bg-mango text-forest shadow-[0_24px_60px_-18px_rgba(246,184,32,.6)] transition duration-300 hover:scale-105 sm:h-44 sm:w-44">
      <motion.svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}>
        <defs><path id={`ring-${id}`} d="M50 50 m-39 0 a39 39 0 1 1 78 0 a39 39 0 1 1 -78 0" /></defs>
        <text fontSize="9.5" fontWeight="800" letterSpacing="1.2" fill="currentColor"><textPath href={`#ring-${id}`} textLength="240" lengthAdjust="spacing">ORDER NOW • ORDER NOW • ORDER NOW •</textPath></text>
      </motion.svg>
      <span className="grid h-14 w-14 place-items-center rounded-full bg-forest text-2xl text-mango transition duration-300 group-hover:rotate-45 sm:h-16 sm:w-16"><FiArrowUpRight aria-hidden /></span>
    </Link>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-6 flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-[.22em] !text-mango">{children}</h2>;
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 py-1.5 text-lg font-semibold text-cream/85 transition hover:text-mango">
      <span className="relative">{children}<span aria-hidden className="absolute -bottom-0.5 left-0 h-px w-0 bg-mango transition-all duration-300 group-hover:w-full" /></span>
      <FiArrowUpRight aria-hidden className="-translate-x-1 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
    </Link>
  );
}

export function Footer() {
  const reduce = useReducedMotion();
  const { data: settings } = useGetSettingsQuery();
  const { data: menu } = useGetMenuQuery();
  const cats = menu?.categories.slice(0, 8) ?? [];
  const [first, second] = SITE.headline.split(", ");
  const pay = [
    settings?.cod_enabled && { icon: FiTruck, label: "Cash on delivery" },
    settings?.easypaisa_enabled && { icon: FiSmartphone, label: "Easypaisa" },
    settings?.bank_enabled && { icon: FiCreditCard, label: "Bank transfer" },
  ].filter(Boolean) as { icon: typeof FiTruck; label: string }[];
  const explore: [string, string][] = [["Menu", "/menu"], ["Featured treats", "/#featured"], ["Reviews", "/#reviews"], ["FAQ", "/#faq"]];

  return (
    <footer className="relative mt-24 overflow-hidden rounded-t-[2rem] bg-[#0A2A20] text-cream sm:rounded-t-[3rem]"
      style={{ backgroundImage: "radial-gradient(50% 40% at 0% 0%, rgba(246,184,32,.14), transparent 70%), radial-gradient(45% 40% at 100% 70%, rgba(229,56,79,.12), transparent 70%)" }}>
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mango/70 to-transparent" />
      <div aria-hidden className="absolute inset-0 opacity-[.04]" style={{ backgroundImage: "radial-gradient(#fff 1.2px, transparent 1.2px)", backgroundSize: "26px 26px" }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* statement + round CTA */}
        <Reveal className="flex flex-col items-start justify-between gap-10 pb-14 pt-16 sm:pt-24 md:flex-row md:items-center">
          <p className="font-display text-[clamp(2.7rem,8.5vw,6.5rem)] font-extrabold leading-[.95] tracking-tight">
            {second ? <>{first},<br /><span className="relative inline-block text-mango">{second}
              <svg aria-hidden viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-2.5 w-full sm:h-3"><path d="M2 8 Q 25 0 50 8 T 100 8 T 150 8 T 198 8" stroke="#E5384F" strokeWidth="4" fill="none" strokeLinecap="round" /></svg>
            </span></> : SITE.headline}
          </p>
          <OrderDisc reduce={reduce} />
        </Reveal>

        {/* link columns, separated by hairlines */}
        <div className="grid gap-12 border-t border-cream/15 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-3">
            <Link href="/" aria-label="Cravy home" className="inline-block"><Logo tone="cream" className="text-4xl" /></Link>
            <p className="mt-5 max-w-xs leading-relaxed text-cream/70">{SITE.description}</p>
          </Reveal>

          <Reveal delay={0.06} className="lg:col-span-2">
            <Heading>Explore</Heading>
            <nav aria-label="Footer"><ul>{explore.map(([name, href]) => <li key={name}><FooterLink href={href}>{name}</FooterLink></li>)}</ul></nav>
          </Reveal>

          <Reveal delay={0.12} className="lg:col-span-3">
            <Heading>Our menu</Heading>
            {cats.length === 0 ? <p className="text-cream/70">Browse everything on the <Link href="/menu" className="font-semibold text-mango underline underline-offset-4">menu</Link>.</p> : (
              <ul className="space-y-3">
                {cats.map((c) => (
                  <li key={c.id}>
                    <Link href="/menu" className="group flex items-baseline gap-3 text-lg font-semibold text-cream/85 transition hover:text-mango">
                      {c.name}
                      {/* <span className="text-sm font-normal text-cream/60">{c.products.length}</span> */}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          <Reveal delay={0.18} className="sm:col-span-2 lg:col-span-4">
            <Heading>Order &amp; pay</Heading>
            {pay.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {pay.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 rounded-2xl border border-cream/15 bg-cream/[.04] px-4 py-3 font-semibold transition hover:border-mango/50 hover:bg-cream/[.08]">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-mango/15 text-mango"><Icon aria-hidden /></span>{label}
                  </li>
                ))}
              </ul>
            )}
            {settings?.phone && <a href={`tel:${settings.phone}`} className="group mt-4 inline-flex items-center gap-3 text-lg font-bold"><span className="grid h-10 w-10 place-items-center rounded-full bg-cream text-forest transition group-hover:rotate-12"><FiPhone aria-hidden /></span><span className="transition group-hover:text-mango">{settings.phone}</span></a>}
            <p className="mt-5 flex items-start gap-2 text-sm text-cream/60"><FiShield aria-hidden className="mt-0.5 shrink-0 text-mint" />We never ask for card details, PINs or passwords.</p>
          </Reveal>
        </div>
      </div>

  {/* giant wordmark: letters pop and change colour on hover */}
      <div className="relative -mb-[0vw] mt-10 select-none overflow-hidden text-center" aria-label="Cravy" role="img">
        <div aria-hidden className="flex justify-center font-display text-[clamp(5.5rem,27vw,24rem)] font-extrabold leading-[.8] tracking-tighter">
          {"CRAVY".split("").map((ch, i) => (
            <motion.span key={i} className="inline-block cursor-default px-[.01em] text-cream/[.14]" whileHover={reduce ? undefined : { y: -24, rotate: i % 2 ? 5 : -5, color: LETTER_COLORS[i % LETTER_COLORS.length] }} whileTap={reduce ? undefined : { y: -24, color: LETTER_COLORS[i % LETTER_COLORS.length] }} transition={{ type: "spring", stiffness: 300, damping: 14 }}>{ch}</motion.span>
          ))}
        </div>
      </div>

      {/* <div className="relative border-t border-cream/15 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-sm text-cream/70 sm:px-6">
          <p>© {new Date().getFullYear()} {settings?.business_name ?? "Cravy"}. All rights reserved.</p>
        </div>
      </div> */}
    </footer>
  );
}