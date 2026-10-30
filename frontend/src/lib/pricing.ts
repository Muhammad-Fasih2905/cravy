import type { Product, Variant } from "./types";

/** What the customer actually pays for a base price / size. The server sends the discounted number; this is the fallback. */
export const discountOf = (p: Pick<Product, "discount_percent">) => Math.max(0, Math.min(90, p.discount_percent ?? 0));
export const applyDiscount = (price: number, percent: number) => (percent > 0 ? Math.round((price * (100 - percent)) / 100) : price);

export const finalBase = (p: Product) => p.final_base_price ?? applyDiscount(p.base_price, discountOf(p));
export const finalOfVariant = (p: Product, v: Variant) => v.final_price ?? applyDiscount(v.price, discountOf(p));

/** Cheapest price the customer can pay for this product (after discount), and the same before discount. */
export function startingPrice(p: Product) {
  const vs = p.variants.filter((v) => v.is_available);
  const final = vs.length ? Math.min(...vs.map((v) => finalOfVariant(p, v))) : finalBase(p);
  const regular = vs.length ? Math.min(...vs.map((v) => v.price)) : p.base_price;
  return { final, regular, percent: discountOf(p) };
}