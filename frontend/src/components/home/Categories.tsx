"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import { FaCocktail, FaGlassMartiniAlt, FaGlassWhiskey, FaIceCream } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import { GiIceCreamCone } from "react-icons/gi";
import { useGetMenuQuery } from "@/store/api";

const icons: Record<string, IconType> = {
  "ice-creams": FaIceCream, coldies: FaGlassWhiskey, margaritas: FaCocktail, mocktails: FaGlassMartiniAlt, "ice-cream-cones": GiIceCreamCone,
};
const tints = ["bg-mango text-forest", "bg-mint text-forest", "bg-strawberry text-cream", "bg-vanilla-deep text-forest", "bg-forest-100 text-forest"];

export function Categories() {
  const { data } = useGetMenuQuery();
  const cats = data?.categories ?? [];
  if (!cats.length) return null;
  return (
    <section aria-labelledby="cats-h">
      <div className="mb-8 text-center">
        <p className="chip">Our menu</p>
        <h2 id="cats-h" className="mt-3 text-3xl sm:text-5xl">Pick your craving</h2>
      </div>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cats.map((c, i) => {
          const Icon = icons[c.slug] ?? FaIceCream;
          return (
            <motion.li key={c.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
              <Link href="/menu" className={`group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-card p-5 shadow-card transition hover:-translate-y-2 hover:shadow-lift ${tints[i % tints.length]}`}>
                <FiArrowUpRight aria-hidden className="self-end text-2xl opacity-60 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100" />
                <Icon aria-hidden className="absolute -bottom-4 -right-4 text-[7rem] opacity-20 transition duration-500 group-hover:rotate-12 group-hover:scale-110" />
                <span>
                  <Icon aria-hidden className="mb-3 text-4xl" />
                  <span className="block font-display text-xl font-extrabold leading-tight">{c.name}</span>
                  <span className="text-sm opacity-80">{c.products.length} {c.products.length === 1 ? "item" : "items"}</span>
                </span>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}