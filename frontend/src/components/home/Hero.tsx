"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiCreditCard, FiSmartphone, FiTruck } from "react-icons/fi";
import { GiIceCreamCone } from "react-icons/gi";
import { SITE } from "@/config/site";
import { formatPKR } from "@/lib/money";
import { useGetMenuQuery } from "@/store/api";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };

export function Hero() {
  const { data } = useGetMenuQuery();
  const all = data?.categories.flatMap((c) => c.products) ?? [];
  const fav = all.find((p) => p.is_featured && p.is_available) ?? all.find((p) => p.is_available);
  const from = fav ? Math.min(...(fav.variants.length ? fav.variants.map((v) => v.price) : [fav.base_price])) : 0;
  const [first, second] = SITE.headline.split(", ");

  return (
    <section className="relative isolate overflow-hidden bg-forest text-cream"
      style={{ backgroundImage: "radial-gradient(60% 60% at 85% 15%, rgba(246,184,32,.30), transparent 60%), radial-gradient(50% 50% at 5% 95%, rgba(168,230,207,.20), transparent 60%)" }}>
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[.07]" style={{ backgroundImage: "radial-gradient(#fff 1.2px, transparent 1.2px)", backgroundSize: "26px 26px" }} />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-28 pt-12 sm:pt-16 lg:grid-cols-2 lg:pb-32">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p variants={item} className="chip bg-vanilla">
            {(data?.categories.map((c) => c.name).slice(0, 4).join(" · ")) || "Ice creams · Shakes · Mocktails"}
          </motion.p>
          <motion.h1 variants={item} className="mt-5 text-5xl !leading-[1.02] !text-cream sm:text-7xl">
            {second ? <>{first},<br /><span className="relative text-mango">{second}
              <svg aria-hidden viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full"><path d="M2 8 Q 25 0 50 8 T 100 8 T 150 8 T 198 8" stroke="#E5384F" strokeWidth="4" fill="none" strokeLinecap="round" /></svg>
            </span></> : SITE.headline}
          </motion.h1>
          <motion.p variants={item} className="mt-6 max-w-md text-lg text-cream/85">{SITE.description}</motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
            <Link href="/menu" className="btn group gap-2 bg-mango text-forest shadow-lift transition hover:bg-vanilla">Order Now<FiArrowRight aria-hidden className="transition group-hover:translate-x-1" /></Link>
            <Link href="/menu" className="btn border-2 border-cream/80 text-cream hover:bg-cream hover:text-forest">Explore Our Menu</Link>
          </motion.div>
          <motion.ul variants={item} className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-cream/90">
            <li className="flex items-center gap-2"><FiTruck aria-hidden className="text-mango" />Cash on delivery</li>
            <li className="flex items-center gap-2"><FiSmartphone aria-hidden className="text-mango" />Easypaisa</li>
            <li className="flex items-center gap-2"><FiCreditCard aria-hidden className="text-mango" />Bank transfer</li>
          </motion.ul>
          {all.length > 0 && (
            <motion.dl variants={item} className="mt-8 flex gap-8">
              <div><dt className="text-sm text-cream/70">On the menu</dt><dd className="font-display text-3xl font-extrabold text-mango">{all.length}+ items</dd></div>
              <div><dt className="text-sm text-cream/70">Categories</dt><dd className="font-display text-3xl font-extrabold text-mango">{data?.categories.length}</dd></div>
            </motion.dl>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative mx-auto aspect-square w-full max-w-[460px]" aria-hidden>
          <div className="absolute inset-0 rounded-full bg-mango/25 blur-3xl" />
          <motion.div animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-[10%] grid place-items-center rounded-full bg-gradient-to-br from-vanilla via-cream to-mint shadow-lift">
            <GiIceCreamCone className="text-forest" size={190} />
          </motion.div>
          <span className="absolute left-[4%] top-[14%] h-16 w-16 animate-float rounded-full bg-strawberry shadow-lift" />
          <span className="absolute right-[2%] top-[34%] h-10 w-10 animate-float rounded-full bg-mango shadow-lift [animation-delay:1s]" />
          <span className="absolute bottom-[18%] right-[8%] h-20 w-20 animate-float rounded-full bg-mint-deep shadow-lift [animation-delay:2s]" />
          <span className="absolute right-[18%] top-[2%] flex items-center gap-2 rounded-pill bg-white px-4 py-2 text-sm font-bold text-forest shadow-lift"><FiTruck />Delivered to you</span>
          {fav && (
            <Link href={`/menu/${fav.slug}`} tabIndex={-1} className="absolute -bottom-2 left-0 w-60 rounded-2xl bg-white/95 p-4 text-ink shadow-lift backdrop-blur transition hover:-translate-y-1 sm:-left-6">
              <span className="chip bg-mango/30 text-xs">Featured</span>
              <p className="mt-2 font-display text-lg font-extrabold text-forest">{fav.name}</p>
              <p className="flex items-center justify-between text-sm">from {formatPKR(from)}<FiArrowRight className="text-forest" /></p>
            </Link>
          )}
        </motion.div>
      </div>
      <svg aria-hidden viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-14 w-full text-cream sm:h-20"><path fill="currentColor" d="M0 40 C 240 90, 480 0, 720 30 S 1200 80, 1440 20 L1440 80 L0 80 Z" /></svg>
    </section>
  );
}