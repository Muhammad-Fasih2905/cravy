"use client";
import { useEffect, useMemo, useState } from "react";
import { useGetMenuQuery } from "@/store/api";
import { FiSearch } from "react-icons/fi";
import { ProductCard } from "./ProductCard";
import { Select } from "./Select";
import { startingPrice } from "@/lib/pricing";

export function MenuBrowser({ onlyFeatured = false }: { onlyFeatured?: boolean }) {
  const { data, isError, refetch } = useGetMenuQuery();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"menu" | "low" | "high">("menu");

  // /menu?cat=ice-cream opens that category (used by the "Pick your craving" cards on the home page).
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("cat");
    if (c) setCat(c);
  }, []);

  const products = useMemo(() => {
    const list = (data?.categories ?? [])
      .filter((c) => cat === "all" || c.slug === cat)
      .flatMap((c) => c.products)
      .filter((p) => (onlyFeatured ? p.is_featured : true))
      .filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));
    if (sort === "low") return [...list].sort((a, b) => startingPrice(a).final - startingPrice(b).final);
    if (sort === "high") return [...list].sort((a, b) => startingPrice(b).final - startingPrice(a).final);
    return list;
  }, [data, cat, q, sort, onlyFeatured]);

  if (isError) return (
    <div role="alert" className="card p-6">Menu could not be loaded. <button className="underline" onClick={() => refetch()}>Try again</button></div>
  );

  return (
    <div>
      {!onlyFeatured && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1"><FiSearch aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-forest" /><input type="search" aria-label="Search menu" placeholder="Search menu" value={q} onChange={(e) => setQ(e.target.value)}
            className="min-h-[48px] w-full rounded-pill border-2 border-vanilla-deep bg-white pl-11 pr-5" /></div>
          <Select label="Sort" value={sort} onChange={(v) => setSort(v as typeof sort)} options={[{ value: "menu", label: "Menu order" }, { value: "low", label: "Price: low to high" }, { value: "high", label: "Price: high to low" }]} />
        </div>
      )}
      {!onlyFeatured && (
        <div role="tablist" aria-label="Categories" className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {[{ slug: "all", name: "All" }, ...(data?.categories ?? [])].map((c) => (
            <button key={c.slug} role="tab" aria-selected={cat === c.slug} onClick={() => setCat(c.slug)}
              className={`chip shrink-0 min-h-[44px] px-5 ${cat === c.slug ? "!bg-forest !text-cream" : ""}`}>{c.name}</button>
          ))}
        </div>
      )}
      {products.length === 0 ? <p className="card p-6">No items found.</p> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}