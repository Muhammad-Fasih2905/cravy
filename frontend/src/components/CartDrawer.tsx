"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMinus, FiPlus, FiShoppingBag, FiTrash2, FiX } from "react-icons/fi";
import { formatPKR } from "@/lib/money";
import { useGetQuoteMutation } from "@/store/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeItem, setCoupon, setOpen, setQty } from "@/store/cartSlice";

export function CartDrawer() {
  const { items, open, coupon: applied } = useAppSelector((s) => s.cart);
  const dispatch = useAppDispatch();
  const [promo, setPromo] = useState("");
  const [getQuote, { data: quote, error, isLoading }] = useGetQuoteMutation();

  // Totals always come from the server, so they match what checkout charges.
  useEffect(() => {
    if (!open || items.length === 0) return;
    const t = setTimeout(() => getQuote({
      items: items.map(({ product_id, variant_id, addon_ids, quantity }) => ({ product_id, variant_id, addon_ids, quantity })),
      coupon_code: applied,
    }), 250);
    return () => clearTimeout(t);
  }, [open, items, applied, getQuote]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && dispatch(setOpen(false));
    if (open) { window.addEventListener("keydown", esc); document.body.style.overflow = "hidden"; }
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open, dispatch]);

  const errMsg = error && "data" in error ? (error.data as { detail?: string })?.detail : error ? "Could not reach the server" : null;
  const close = () => dispatch(setOpen(false));

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Shopping cart">
          <motion.button className="absolute inset-0 bg-ink/40" aria-label="Close cart" onClick={close}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream p-5 shadow-lift"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl"><FiShoppingBag aria-hidden />Your cart</h2>
              <button onClick={close} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full hover:bg-vanilla"><FiX size={22} /></button>
            </div>
            {items.length === 0 ? <p className="mt-8">Your cart is empty. <Link href="/menu" onClick={close} className="font-bold underline">Browse the menu</Link></p> : (
              <>
                <ul className="mt-4 flex-1 space-y-3 overflow-y-auto">
                  <AnimatePresence initial={false}>
                    {items.map((i) => (
                      <motion.li key={i.key} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 40 }} className="card p-4">
                        <div className="flex justify-between gap-2">
                          <div><p className="font-bold">{i.name}</p><p className="text-sm">{[i.variantName, ...i.addonNames].filter(Boolean).join(", ")}</p></div>
                          <button className="grid h-10 w-10 place-items-center rounded-full text-strawberry hover:bg-strawberry/10" aria-label={`Remove ${i.name}`} onClick={() => dispatch(removeItem(i.key))}><FiTrash2 /></button>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <button className="chip h-10 w-10 justify-center" aria-label="Decrease" onClick={() => dispatch(setQty({ key: i.key, quantity: i.quantity - 1 }))}><FiMinus /></button>
                          <span aria-live="polite" className="w-6 text-center font-bold">{i.quantity}</span>
                          <button className="chip h-10 w-10 justify-center" aria-label="Increase" onClick={() => dispatch(setQty({ key: i.key, quantity: i.quantity + 1 }))}><FiPlus /></button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); dispatch(setCoupon(promo.trim().toUpperCase() || null)); }}>
                  <input aria-label="Promo code" placeholder="Promo code" value={promo} onChange={(e) => setPromo(e.target.value)} className="min-h-[44px] flex-1 rounded-pill border-2 border-vanilla-deep bg-white px-4" />
                  <button className="btn-secondary min-h-[44px] px-4" type="submit">Apply</button>
                </form>
                {errMsg && <p role="alert" className="mt-2 text-sm text-strawberry">{errMsg}</p>}
                <dl className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between"><dt>Subtotal</dt><dd>{quote ? formatPKR(quote.subtotal) : "…"}</dd></div>
                  <div className="flex justify-between"><dt>Delivery</dt><dd>{!quote ? "…" : quote.delivery_pending ? "By distance, at checkout" : formatPKR(quote.delivery_charge)}</dd></div>
                  {!!quote?.tax_total && <div className="flex justify-between"><dt>Tax</dt><dd>{formatPKR(quote.tax_total)}</dd></div>}
                  {!!quote?.discount_total && <div className="flex justify-between"><dt>Discount</dt><dd>−{formatPKR(quote.discount_total)}</dd></div>}
                  <div className="flex justify-between text-lg font-bold text-forest"><dt>Total</dt><dd>{quote ? formatPKR(quote.total) : isLoading ? "…" : ""}</dd></div>
                </dl>
                {quote && !quote.meets_minimum && <p className="mt-2 text-sm text-strawberry">Minimum order is {formatPKR(quote.min_order_value)}.</p>}
                <Link href="/checkout" onClick={close} className="btn-primary mt-3 w-full">Checkout{quote ? ` · ${formatPKR(quote.total)}` : ""}</Link>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}