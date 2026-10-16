"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiShoppingBag } from "react-icons/fi";
import { Logo } from "@/components/brand/Logo";
import { useGetSettingsQuery } from "@/store/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setOpen } from "@/store/cartSlice";

export function Navbar() {
  const { data: settings } = useGetSettingsQuery();
  const count = useAppSelector((s) => s.cart.items.reduce((n, i) => n + i.quantity, 0));
  const dispatch = useAppDispatch();
  return (
    <header className="sticky top-0 z-30 border-b border-vanilla-deep/60 bg-cream/80 backdrop-blur-lg">
      <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" aria-label="Cravy home"><Logo /></Link>
        <div className="hidden items-center gap-1 font-semibold text-forest md:flex">
          {[["Menu", "/menu"], ["Reviews", "/#reviews"], ["FAQ", "/#faq"]].map(([n, h]) => (
            <Link key={n} href={h} className="rounded-pill px-4 py-2 transition hover:bg-vanilla">{n}</Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/menu" className="btn-secondary min-h-[44px] px-5 md:hidden">Menu</Link>
          <motion.button whileTap={{ scale: 0.93 }} className="btn-primary relative min-h-[44px] gap-2 px-5" onClick={() => dispatch(setOpen(true))} aria-label={`Open cart, ${count} items`}>
            <FiShoppingBag size={20} aria-hidden /><span className="hidden sm:inline">Cart</span>
            {count > 0 && <motion.span key={count} initial={{ scale: 1.7 }} animate={{ scale: 1 }} className="grid h-6 min-w-6 place-items-center rounded-full bg-mango px-1.5 text-sm text-forest">{count}</motion.span>}
          </motion.button>
        </div>
      </nav>
    </header>
  );
}