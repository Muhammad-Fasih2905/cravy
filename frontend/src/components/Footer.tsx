"use client";
import Link from "next/link";
import { FiPhone } from "react-icons/fi";
import { Logo } from "@/components/brand/Logo";
import { useGetSettingsQuery } from "@/store/api";

export function Footer() {
  const { data } = useGetSettingsQuery();
  return (
    <footer className="mt-20 bg-forest text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div><Logo tone="cream" /><p className="mt-2 text-sm text-cream/80">Your Cravings, Your Way.</p></div>
        <nav aria-label="Footer" className="flex flex-wrap gap-5 font-semibold">
          <Link href="/menu">Menu</Link><Link href="/#faq">FAQ</Link>
          {data?.phone && <a href={`tel:${data.phone}`} className="inline-flex items-center gap-2"><FiPhone aria-hidden />{data.phone}</a>}
        </nav>
      </div>
      <p className="border-t border-cream/20 py-4 text-center text-sm text-cream/70">© {new Date().getFullYear()} Cravy</p>
    </footer>
  );
}
