"use client";
import Image from "next/image";
import Link from "next/link";
import { GiIceCreamCone } from "react-icons/gi";
import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { formatPKR } from "@/lib/money";
import { discountOf, finalBase, finalOfVariant } from "@/lib/pricing";
import { useAppDispatch } from "@/store/hooks";
import { addItem } from "@/store/cartSlice";
import { PUBLIC_API as API } from "@/lib/config";


export function ProductCard({ p }: { p: Product }) {
  const dispatch = useAppDispatch();
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
    <motion.article layout initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -4 }} transition={{ duration: 0.35 }} className="card flex flex-col gap-3 p-5 hover:shadow-lift">
      <div className="relative -mx-5 -mt-5 mb-1 aspect-[4/3] overflow-hidden rounded-t-card bg-gradient-to-br from-vanilla to-mint">
        {percent > 0 && <span className="absolute left-3 top-3 z-10 rounded-pill bg-strawberry px-3 py-1 text-sm font-extrabold text-cream shadow-card">{percent}% OFF</span>}
        {p.image_url ? (
          <Image src={p.image_url.startsWith("http") ? p.image_url : `${API}${p.image_url}`} alt={p.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 hover:scale-105" unoptimized={API.includes("localhost")} />
        ) : (
          <div className="grid h-full place-items-center text-forest/40" aria-hidden><GiIceCreamCone size={64} /></div>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl"><Link href={`/menu/${p.slug}`} className="hover:underline">{p.name}</Link></h3>
        {p.is_bestseller && <span className="chip bg-mango/30">Bestseller</span>}
      </div>
      {p.description && <p className="text-sm text-ink/80">{p.description}</p>}
      {p.is_demo && <p className="text-xs font-semibold text-strawberry">DEMO ITEM</p>}

      {variants.length > 0 && (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Size</legend>
          {variants.map((v) => (
            <label key={v.id} className={`chip cursor-pointer ${variant?.id === v.id ? "!bg-forest !text-cream" : ""}`}>
              <input type="radio" className="sr-only" name={`v-${p.id}`} checked={variant?.id === v.id} onChange={() => setVariantId(v.id)} />
              {v.name} · {formatPKR(finalOfVariant(p, v))}{percent > 0 && <s className="ml-1 text-xs opacity-60">{formatPKR(v.price)}</s>}
            </label>
          ))}
        </fieldset>
      )}
      {addons.length > 0 && (
        <fieldset className="flex flex-wrap gap-2">
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

      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="flex items-baseline gap-2">
          <strong className="text-lg text-forest">{formatPKR(price)}</strong>
          {percent > 0 && <s className="text-sm text-ink/60">{formatPKR(regularPrice)}</s>}
        </span>
        {p.is_available ? (
          <motion.button whileTap={{ scale: 0.94 }} className="btn-primary gap-2" onClick={() =>
            dispatch(addItem({
              product_id: p.id, variant_id: variant?.id ?? null, addon_ids: pickedIds, quantity: 1,
              name: p.name, variantName: variant?.name ?? null,
              addonNames: addons.filter((a) => pickedIds.includes(a.id)).map((a) => a.name), unitPrice: price,
            }))}><FiPlus aria-hidden />Add</motion.button>
        ) : <span className="chip">Out of stock</span>}
      </div>
    </motion.article>
  );
}