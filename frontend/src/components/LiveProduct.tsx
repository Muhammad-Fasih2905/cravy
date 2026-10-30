"use client";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { useGetProductQuery } from "@/store/api";
import { MENU_POLL_MS } from "@/lib/menuSync";
import { ProductCard } from "./ProductCard";

/** The product page: starts with what the server rendered, then keeps itself current (price, discount, photo, availability). */
export function LiveProduct({ slug, initial }: { slug: string; initial: Product }) {
  const { data, error } = useGetProductQuery(slug, { pollingInterval: MENU_POLL_MS, skipPollingIfUnfocused: true, refetchOnFocus: true, refetchOnReconnect: true });
  if (error && "status" in error && error.status === 404) {
    return <p className="card p-6">This item is no longer on the menu. <Link href="/menu" className="underline">See the full menu</Link></p>;
  }
  const p = data ?? initial;
  return (
    <>
      <h1 className="mb-6 text-4xl">{p.name}</h1>
      <ProductCard p={p} />
    </>
  );
}