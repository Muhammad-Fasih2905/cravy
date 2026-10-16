"use client";
import Link from "next/link";
import { FiShoppingBag as ShoppingBag } from "react-icons/fi";
import { Logo } from "@/components/brand/Logo";
import { useGetSettingsQuery } from "@/store/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setOpen } from "@/store/cartSlice";

export function Navbar() {
  const { data: settings } = useGetSettingsQuery();
  const count = useAppSelector((s) => s.cart.items.reduce((n, i) => n + i.quantity, 0));
  const dispatch = useAppDispatch();
  return (
    <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur">
      {/* {settings?.announcement && (
        <p className="bg-forest px-4 py-2 text-center text-sm text-cream">{settings.announcement}</p>
      )} */}
      <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" aria-label="Cravy home"><Logo /></Link>
        <div className="flex items-center gap-2">
          <Link href="/menu" className="btn-secondary min-h-[44px] px-4">Menu</Link>
          <button className="btn-primary relative px-4" onClick={() => dispatch(setOpen(true))} aria-label={`Open cart, ${count} items`}>
            <ShoppingBag size={20} aria-hidden />
            {count > 0 && <span className="ml-2 rounded-full bg-mango px-2 text-sm text-forest">{count}</span>}
          </button>
        </div>
      </nav>
    </header>
  );
}
