"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import { FaBlender, FaCocktail, FaGlassMartiniAlt, FaGlassWhiskey, FaIceCream, FaLemon, FaWineGlassAlt } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import { GiIceCreamCone } from "react-icons/gi";
import { useGetMenuQuery } from "@/store/api";
import { formatPKR } from "@/lib/money";
import { discountOf, startingPrice } from "@/lib/pricing";
import { groupCategories } from "@/config/menuGroups";

// Keys are the category slugs the backend sends (see menu_data.py). Anything new falls back to the ice cream icon.
const icons: Record<string, IconType> = {
  "ice-cream": FaIceCream, margaritas: FaCocktail, mocktails: FaGlassMartiniAlt, "fresh-juices": FaLemon,
  coladas: FaWineGlassAlt, soda: FaGlassWhiskey, "ice-cream-shakes": GiIceCreamCone, "milk-shakes": FaBlender,
};
const tints = ["bg-mango text-forest", "bg-mint text-forest", "bg-strawberry text-cream", "bg-vanilla-deep text-forest", "bg-forest-100 text-forest"];

export function Categories() {
  const { data } = useGetMenuQuery();
  // Only what a customer can actually order: categories with at least one available product (live from the server).
  const cats = (data?.categories ?? [])
    .map((c) => ({ ...c, items: c.products.filter((p) => p.is_available) }))
    .filter((c) => c.items.length > 0);
  if (!cats.length) return null;
  // Menu headings (Ice Creams, Shakes...) with their categories underneath, same arrangement as the /menu page.
  const groups = groupCategories(cats);
  return (
    <section aria-labelledby="cats-h">
      <div className="mb-10 text-center">
        <p className="chip">Our menu</p>
        <h2 id="cats-h" className="mt-3 text-3xl sm:text-5xl">Pick your craving</h2>
      </div>
      <div className="space-y-12">
        {groups.map((g) => {
          const total = g.cats.reduce((n, c) => n + c.items.length, 0);
          return (
            <div key={g.id} aria-labelledby={`home-menu-${g.id}`}>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b-2 border-forest/15 pb-2">
                <h3 id={`home-menu-${g.id}`} className="text-2xl text-forest sm:text-4xl">
                  {g.name} <span className="text-base font-medium text-ink/50 sm:text-lg">{total} {total === 1 ? "item" : "items"}</span>
                </h3>
                <Link href={`/menu?menu=${encodeURIComponent(g.id)}`} className="group inline-flex items-center gap-1.5 text-sm font-bold text-forest sm:text-base">
                  See all {g.name}<FiArrowUpRight aria-hidden className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
                {g.cats.map((c, i) => {
                  const Icon = icons[c.slug] ?? FaIceCream;
                  const from = Math.min(...c.items.map((p) => startingPrice(p).final));
                  const bestOff = Math.max(0, ...c.items.map(discountOf));
                  return (
                    <motion.li key={c.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i, 4) * 0.07 }}>
                      <Link href={`/menu?cat=${encodeURIComponent(c.slug)}`} aria-label={`${g.name}: ${c.name}, ${c.items.length} items, from ${formatPKR(from)}`}
                        className={`group relative flex aspect-[5/4] flex-col justify-between overflow-hidden rounded-2xl p-3.5 shadow-card transition hover:-translate-y-2 hover:shadow-lift ${tints[i % tints.length]}`}>
                        <span className="flex items-start justify-between">
                          {bestOff > 0 ? <span className="rounded-pill bg-forest px-2 py-0.5 text-[11px] font-extrabold text-mango">Up to {bestOff}% off</span> : <span />}
                          <FiArrowUpRight aria-hidden className="text-lg opacity-60 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100" />
                        </span>
                        <Icon aria-hidden className="absolute -bottom-3 -right-3 text-[5rem] opacity-20 transition duration-500 group-hover:rotate-12 group-hover:scale-110" />
                        <span>
                          <Icon aria-hidden className="mb-1.5 text-2xl" />
                          <span className="block font-display text-base font-extrabold leading-tight sm:text-lg">{c.name}</span>
                          <span className="block text-xs opacity-80">{c.items.length} {c.items.length === 1 ? "item" : "items"} · from {formatPKR(from)}</span>
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}