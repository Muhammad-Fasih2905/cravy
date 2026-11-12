"use client";
import { useEffect, useMemo, useState } from "react";
import { useGetMenuQuery } from "@/store/api";
import { FiSearch, FiX } from "react-icons/fi";
import { ProductCard } from "./ProductCard";
import { Select } from "./Select";
import { startingPrice } from "@/lib/pricing";
import { groupCategories } from "@/config/menuGroups";
import { isHiddenWaffleTopping } from "@/config/waffleFlavours";
import type { Category, Product } from "@/lib/types";

type Sort = "menu" | "low" | "high";
const order = (list: Product[], sort: Sort) =>
  sort === "low" ? [...list].sort((a, b) => startingPrice(a).final - startingPrice(b).final)
    : sort === "high" ? [...list].sort((a, b) => startingPrice(b).final - startingPrice(a).final) : list;

/** The grid of product cards: one column list on phones (picture on the side), 2 / 3 columns from tablet up. */
const Grid = ({ items }: { items: Product[] }) => (
  <div className="grid items-start gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
);

export function MenuBrowser({ onlyFeatured = false }: { onlyFeatured?: boolean }) {
  const { data, isError, refetch } = useGetMenuQuery();
  const [cat, setCat] = useState("all");
  const [menu, setMenu] = useState("all"); // a whole menu heading (Ice Creams, Shakes...), set by /menu?menu=shakes from the home page
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("menu");

  // /menu?cat=ice-cream opens that category, /menu?menu=shakes opens that whole menu (used by the home page).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("cat"), m = params.get("menu");
    if (c) setCat(c);
    else if (m) setMenu(m);
  }, []);

  const needle = q.trim().toLowerCase();
  const categories = data?.categories ?? [];

  // "All": every menu heading with its own products under it. A single category: just that category.
  const sections = useMemo(() => {
    // In the Waffle menu the topping products (Vanilla Cream Waffle, Strawberry Velvet...) are not cards: they show inside each waffle.
    const visible = (c: Category) => order(c.products.filter((p) => p.name.toLowerCase().includes(needle) && !(isHiddenWaffleTopping(c.slug, p.name) || isHiddenWaffleTopping(c.name, p.name))), sort);
    if (cat !== "all") {
      const c = categories.find((x) => x.slug === cat);
      const items = c ? visible(c) : [];
      return items.length ? [{ id: cat, name: c!.name, parts: [{ slug: cat, name: c!.name, items }] }] : [];
    }
    return groupCategories(categories)
      .filter((g) => menu === "all" || g.id === menu)
      .map((g) => ({ id: g.id, name: g.name, parts: g.cats.map((c) => ({ slug: c.slug, name: c.name, items: visible(c) })).filter((x) => x.items.length > 0) }))
      .filter((g) => g.parts.length > 0);
  }, [categories, cat, menu, needle, sort]);

  const featured = useMemo(
    () => order(categories.flatMap((c) => c.products).filter((p) => p.is_featured && p.name.toLowerCase().includes(needle)), sort),
    [categories, needle, sort],
  );

  if (isError) return (
    <div role="alert" className="card p-6">Menu could not be loaded. <button className="underline" onClick={() => refetch()}>Try again</button></div>
  );

  // Home page strip: featured items only, no menu structure.
  if (onlyFeatured) return featured.length === 0 ? <p className="card p-6">No items found.</p> : <Grid items={featured} />;

  const pickCat = (slug: string) => { setCat(slug); setMenu("all"); };
  const menuName = menu !== "all" ? groupCategories(categories).find((g) => g.id === menu)?.name : null;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center">
        <div className="relative flex-1"><FiSearch aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-forest" /><input type="search" aria-label="Search menu" placeholder="Search menu" value={q} onChange={(e) => setQ(e.target.value)}
          className="min-h-[48px] w-full rounded-pill border-2 border-vanilla-deep bg-white pl-11 pr-5" /></div>
        <Select label="Sort" value={sort} onChange={(v) => setSort(v as Sort)} options={[{ value: "menu", label: "Menu order" }, { value: "low", label: "Price: low to high" }, { value: "high", label: "Price: high to low" }]} />
      </div>

      {/* Category tabs: underlined text tabs on phones, pills from tablet up */}
      <div role="tablist" aria-label="Categories"
        className="-mx-5 mb-5 flex overflow-x-auto border-b border-ink/10 px-5 sm:mx-0 sm:mb-6 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:border-0 sm:px-0 sm:pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[{ slug: "all", name: "All" }, ...categories].map((c) => {
          const on = cat === c.slug;
          return (
            <button key={c.slug} role="tab" aria-selected={on} onClick={() => pickCat(c.slug)}
              className={`relative shrink-0 whitespace-nowrap px-4 py-3 text-[0.95rem] font-bold transition-colors sm:chip sm:min-h-[44px] sm:px-5 sm:py-1 ${on ? "text-strawberry sm:!bg-forest sm:!text-cream" : "text-ink/70 sm:text-forest"}`}>
              {c.name}
              <span aria-hidden className={`absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-strawberry transition-opacity sm:hidden ${on ? "opacity-100" : "opacity-0"}`} />
            </button>
          );
        })}
      </div>

      {menuName && (
        <p className="mb-4 flex items-center gap-2 text-sm text-ink/70">
          Showing the <strong className="text-forest">{menuName}</strong> menu
          <button type="button" onClick={() => setMenu("all")} className="inline-flex min-h-[36px] items-center gap-1 rounded-pill bg-vanilla px-3 font-semibold text-forest"><FiX aria-hidden />Show all menus</button>
        </p>
      )}

      {sections.length === 0 ? <p className="card p-6">No items found.</p> : (
        <div className="space-y-10 sm:space-y-12">
          {sections.map((s) => (
            <section key={s.id} aria-labelledby={`menu-${s.id}`} className="scroll-mt-24">
              <h2 id={`menu-${s.id}`} className="mb-4 text-[1.75rem] font-extrabold leading-tight text-ink sm:mb-5 sm:border-b-2 sm:border-forest/15 sm:pb-2 sm:text-4xl sm:font-bold sm:text-forest">{s.name}</h2>
              <div className="space-y-7 sm:space-y-8">
                {s.parts.map((part) => (
                  <div key={part.slug}>
                    {/* A menu with several categories (Shakes, Drinks) names each one; a single-category menu does not repeat itself */}
                    {s.parts.length > 1 && (
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-forest/90 sm:mb-4 sm:text-2xl">
                        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-mango" />{part.name}
                        <span className="text-sm font-medium text-ink/50">{part.items.length} {part.items.length === 1 ? "item" : "items"}</span>
                      </h3>
                    )}
                    <Grid items={part.items} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}