"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const closeRef = useRef<HTMLButtonElement>(null);

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
    if (open) {
      window.addEventListener("keydown", esc);
      document.body.style.overflow = "hidden";
      closeRef.current?.focus();
    }
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open, dispatch]);

  const errMsg = error && "data" in error ? (error.data as { detail?: string })?.detail : error ? "Could not reach the server" : null;
  const close = () => dispatch(setOpen(false));
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Shopping cart">
          <motion.button className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" aria-label="Close cart" onClick={close}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

          {/*
            Layout: header (fixed) / scrolling middle / footer (fixed).
            - 100dvh keeps the footer visible above mobile browser toolbars (h-full is the fallback).
            - env(safe-area-inset-*) keeps content clear of notches and home indicators.
            - Full width on phones, a fixed-width panel from the sm breakpoint up.
          */}
          <motion.aside
            className="absolute right-0 top-0 flex h-full w-full flex-col overflow-hidden bg-cream pr-[env(safe-area-inset-right)] shadow-lift sm:w-[26rem] sm:rounded-l-3xl lg:w-[28rem]"
            style={{ height: "100dvh" }}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-vanilla-deep/60 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-4">
              <h2 className="flex min-w-0 items-center gap-2 text-xl sm:text-2xl">
                <FiShoppingBag aria-hidden className="shrink-0" />
                <span className="truncate">Your cart</span>
                {count > 0 && <span className="shrink-0 text-base font-normal opacity-60">· {count}</span>}
              </h2>
              <button ref={closeRef} onClick={close} aria-label="Close" className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-vanilla">
                <FiX size={22} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-vanilla text-forest"><FiShoppingBag size={26} aria-hidden /></span>
                <p className="text-lg font-bold">Your cart is empty</p>
                <p className="max-w-[16rem] text-sm opacity-75">Add a few favourites from the menu and they will show up here.</p>
                <Link href="/menu" onClick={close} className="btn-primary min-h-[48px] px-8">Browse the menu</Link>
              </div>
            ) : (
              <>
                {/* Scrolling middle: items, promo code, messages */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                  <ul className="space-y-3">
                    <AnimatePresence initial={false}>
                      {items.map((i) => {
                        const detail = [i.variantName, ...i.addonNames].filter(Boolean).join(", ");
                        return (
                          <motion.li key={i.key} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 40 }} className="card p-3.5 sm:p-4">
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="break-words font-bold leading-snug">{i.name}</p>
                                {detail && <p className="mt-0.5 break-words text-sm leading-snug opacity-75">{detail}</p>}
                              </div>
                              <button className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-strawberry hover:bg-strawberry/10" aria-label={`Remove ${i.name}`} onClick={() => dispatch(removeItem(i.key))}>
                                <FiTrash2 />
                              </button>
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <button className="chip h-10 w-10 justify-center" aria-label="Decrease" onClick={() => dispatch(setQty({ key: i.key, quantity: i.quantity - 1 }))}><FiMinus /></button>
                              <span aria-live="polite" className="min-w-[1.5rem] text-center font-bold tabular-nums">{i.quantity}</span>
                              <button className="chip h-10 w-10 justify-center" aria-label="Increase" onClick={() => dispatch(setQty({ key: i.key, quantity: i.quantity + 1 }))}><FiPlus /></button>
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>

                  <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); dispatch(setCoupon(promo.trim().toUpperCase() || null)); }}>
                    <input
                      aria-label="Promo code" placeholder="Promo code" value={promo} onChange={(e) => setPromo(e.target.value)}
                      autoComplete="off" autoCapitalize="characters" spellCheck={false} enterKeyHint="done"
                      className="min-h-[44px] min-w-0 flex-1 rounded-pill border-2 border-vanilla-deep bg-white px-4 text-base"
                    />
                    <button className="btn-secondary min-h-[44px] shrink-0 px-4" type="submit">Apply</button>
                  </form>

                  {errMsg && <p role="alert" className="mt-2 text-sm text-strawberry">{errMsg}</p>}
                  {applied && !errMsg && (
                    <p className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-forest/10 px-3 py-2 text-sm font-semibold text-forest">
                      <span className="min-w-0 truncate">Code {applied} applied</span>
                      <button type="button" className="shrink-0 underline" onClick={() => { dispatch(setCoupon(null)); setPromo(""); }}>Remove</button>
                    </p>
                  )}
                </div>

                {/* Footer: totals and checkout, always visible */}
                <div className="shrink-0 border-t border-vanilla-deep/60 bg-cream px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_18px_-14px_rgba(0,0,0,.25)] sm:px-5">
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4"><dt>Subtotal</dt><dd className="text-right tabular-nums">{quote ? formatPKR(quote.subtotal) : "…"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="shrink-0">Delivery</dt><dd className="text-right tabular-nums">{!quote ? "…" : quote.delivery_pending ? "By distance, at checkout" : formatPKR(quote.delivery_charge)}</dd></div>
                    {!!quote?.tax_total && <div className="flex justify-between gap-4"><dt>Tax</dt><dd className="text-right tabular-nums">{formatPKR(quote.tax_total)}</dd></div>}
                    {!!quote?.discount_total && <div className="flex justify-between gap-4"><dt>Discount</dt><dd className="text-right tabular-nums">−{formatPKR(quote.discount_total)}</dd></div>}
                    <div className="flex justify-between gap-4 border-t border-vanilla-deep/60 pt-2 text-lg font-bold text-forest"><dt>Total</dt><dd className="text-right tabular-nums">{quote ? formatPKR(quote.total) : isLoading ? "…" : ""}</dd></div>
                  </dl>
                  {quote && !quote.meets_minimum && <p className="mt-2 text-sm text-strawberry">Minimum order is {formatPKR(quote.min_order_value)}.</p>}
                  <Link href="/checkout" onClick={close} className="btn-primary mt-3 min-h-[48px] w-full">Checkout{quote ? ` · ${formatPKR(quote.total)}` : ""}</Link>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}