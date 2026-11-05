"use client";
import Image from "next/image";
import Link from "next/link";
import { GiIceCreamCone } from "react-icons/gi";
import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import type { Product } from "@/lib/types";
import { formatPKR } from "@/lib/money";
import { discountOf, finalBase, finalOfVariant } from "@/lib/pricing";
import { useAppDispatch } from "@/store/hooks";
import { addItem } from "@/store/cartSlice";
import { PUBLIC_API as API } from "@/lib/config";


/** Hearted products are remembered in this browser only (a per-visitor convenience; it never reaches the server). */
const FAV_KEY = "cravy:favourites";
const readFavs = (): number[] => {
  try { const v = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "number") : []; } catch { return []; }
};

export function ProductCard({ p }: { p: Product }) {
  const dispatch = useAppDispatch();
  const [fav, setFav] = useState(false);
  useEffect(() => { setFav(readFavs().includes(p.id)); }, [p.id]);
  const toggleFav = () => {
    const next = !fav;
    setFav(next);
    try {
      const rest = readFavs().filter((id) => id !== p.id);
      localStorage.setItem(FAV_KEY, JSON.stringify(next ? [...rest, p.id] : rest));
    } catch { /* storage blocked: the heart still toggles for this visit */ }
  };
  const variants = p.variants.filter((v) => v.is_available);
  const [variantId, setVariantId] = useState<number | null>(variants[0]?.id ?? null);
  const [addonIds, setAddonIds] = useState<number[]>([]);
  // The menu can change while the page is open: fall back to the first size if the chosen one was removed, and drop removed extras.
  const variant = variants.find((v) => v.id === variantId) ?? variants[0] ?? null;
  const addons = p.addons.filter((a) => a.is_available);
  const pickedIds = addonIds.filter((id) => addons.some((a) => a.id === id));

  const percent = discountOf(p);
  // Display price only; the server recalculates it at quote and checkout. The admin's discount applies to the size/base price, not to extras.
  const addonsTotal = addons.filter((a) => pickedIds.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const price = useMemo(
    () => (variant ? finalOfVariant(p, variant) : finalBase(p)) + addonsTotal,
    [variant, p, addonsTotal],
  );
  const regularPrice = (variant?.price ?? p.base_price) + addonsTotal;

  return (
    // Phones: a horizontal row (picture on the left, details on the right). From 640px: the vertical card.
    <motion.article layout initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -4 }} transition={{ duration: 0.35 }}
      className="card flex gap-3.5 rounded-[1.25rem] p-3 hover:shadow-lift sm:flex-col sm:gap-3 sm:rounded-card sm:p-5">
      <div className="relative aspect-square w-[38%] max-w-[11rem] shrink-0 self-start overflow-hidden rounded-xl bg-gradient-to-br from-vanilla to-mint sm:-mx-5 sm:-mt-5 sm:mb-1 sm:aspect-[4/3] sm:w-auto sm:max-w-none sm:self-stretch sm:rounded-b-none sm:rounded-t-card">
        {percent > 0 && <span className="absolute left-2 top-2 z-10 rounded-pill bg-strawberry px-2 py-0.5 text-[11px] font-extrabold text-cream shadow-card sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-sm">{percent}% OFF</span>}
        {p.image_url ? (
          <Image src={p.image_url.startsWith("http") ? p.image_url : `${API}${p.image_url}`} alt={p.name} fill sizes="(max-width: 640px) 38vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 hover:scale-105" unoptimized={API.includes("localhost")} />
        ) : (
          <div className="grid h-full place-items-center text-forest/40" aria-hidden><GiIceCreamCone size={48} /></div>
        )}
      </div>

      {/* details: on phones this is the right-hand column; from 640px its children simply sit in the card */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:contents">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[1.05rem] font-extrabold leading-snug sm:line-clamp-none sm:text-xl sm:font-bold"><Link href={`/menu/${p.slug}`} className="hover:underline">{p.name}</Link></h3>
          {p.is_bestseller && <span className="chip hidden bg-mango/30 sm:inline-flex">Bestseller</span>}
        </div>
        {p.description && <p className="line-clamp-2 text-[0.9rem] leading-snug text-ink/60 sm:line-clamp-none sm:text-sm sm:text-ink/80">{p.description}</p>}
        {p.is_demo && <p className="text-xs font-semibold text-strawberry">DEMO ITEM</p>}

        {variants.length > 0 && (
          <fieldset className="flex flex-wrap gap-1.5 sm:gap-2">
            <legend className="sr-only">Size</legend>
            {variants.map((v) => (
              <label key={v.id} className={`chip cursor-pointer !px-2.5 !py-1 text-xs sm:!px-3 sm:text-sm ${variant?.id === v.id ? "!bg-forest !text-cream" : ""}`}>
                <input type="radio" className="sr-only" name={`v-${p.id}`} checked={variant?.id === v.id} onChange={() => setVariantId(v.id)} />
                {v.name}<span className="hidden sm:inline">&nbsp;· {formatPKR(finalOfVariant(p, v))}</span>{percent > 0 && <s className="ml-1 hidden text-xs opacity-60 sm:inline">{formatPKR(v.price)}</s>}
              </label>
            ))}
          </fieldset>
        )}
        {addons.length > 0 && (
          <fieldset className="flex flex-wrap gap-x-3 gap-y-1 sm:gap-2">
            <legend className="sr-only">Extras</legend>
            {addons.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-5 w-5 accent-forest" checked={pickedIds.includes(a.id)}
                  onChange={(e) => setAddonIds((c) => (e.target.checked ? [...c, a.id] : c.filter((x) => x !== a.id)))} />
                {a.name} +{formatPKR(a.price)}
              </label>
            ))}
          </fieldset>
        )}

        <div className="mt-auto flex flex-col gap-2.5 pt-1 sm:flex-row sm:items-center sm:justify-between sm:pt-2">
          {/* price: a coloured pill on phones, plain text from 640px */}
          <span className="flex items-baseline gap-2">
            <strong className="inline-flex w-fit items-center rounded-lg bg-strawberry px-3 py-1.5 text-[1.05rem] font-extrabold leading-none text-cream sm:rounded-none sm:bg-transparent sm:p-0 sm:text-lg sm:font-bold sm:text-forest">{formatPKR(price)}</strong>
            {percent > 0 && <s className="text-xs text-ink/60 sm:text-sm">{formatPKR(regularPrice)}</s>}
          </span>
          <div className="flex items-center gap-1 sm:justify-between sm:gap-2">
            {p.is_available ? (
              <motion.button whileTap={{ scale: 0.94 }} className="btn-primary min-h-[46px] min-w-0 gap-2 whitespace-nowrap px-5 max-sm:max-w-[11rem] max-sm:flex-1 max-sm:rounded-xl max-sm:px-3 max-sm:text-[0.92rem] sm:min-h-[48px]" onClick={() =>
                dispatch(addItem({
                  product_id: p.id, variant_id: variant?.id ?? null, addon_ids: pickedIds, quantity: 1,
                  name: p.name, variantName: variant?.name ?? null,
                  addonNames: addons.filter((a) => pickedIds.includes(a.id)).map((a) => a.name), unitPrice: price,
                }))}>
                <FiPlus aria-hidden className="hidden sm:block" /><span className="sm:hidden">Add To Cart</span><span className="hidden sm:inline">Add</span>
              </motion.button>
            ) : <span className="chip">Out of stock</span>}
            <button type="button" onClick={toggleFav} aria-pressed={fav} aria-label={fav ? `Remove ${p.name} from favourites` : `Add ${p.name} to favourites`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[1.35rem] text-strawberry transition active:scale-90 sm:hidden">
              {fav ? <FaHeart aria-hidden /> : <FaRegHeart aria-hidden className="text-ink/45" />}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}