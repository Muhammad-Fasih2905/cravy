"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiClock, FiCreditCard, FiExternalLink, FiLogOut, FiShoppingBag } from "react-icons/fi";
import { useAdminStatsQuery } from "@/store/api";
import { Logo } from "../brand/Logo";

type TabDef = { id: string; name: string; icon: React.ElementType };

export function AdminHeader({ tab, onTab, tabs, onLogout }: { tab: string; onTab: (id: string) => void; tabs: TabDef[]; onLogout: () => void }) {
    const { data: s } = useAdminStatsQuery();
    const now = new Date();
    const hour = now.getHours();
    const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const today = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    const chips = [
        { label: "Today's orders", value: s?.today_orders, icon: FiShoppingBag, hot: false },
        { label: "Pending orders", value: s?.pending_orders, icon: FiClock, hot: (s?.pending_orders ?? 0) > 0 },
        { label: "Payments to verify", value: s?.pending_payments, icon: FiCreditCard, hot: (s?.pending_payments ?? 0) > 0 },
    ];

    return (
        <header className="relative isolate overflow-hidden rounded-b-[2rem] bg-forest text-cream shadow-lift print:hidden sm:rounded-b-[2.5rem]"
            style={{ backgroundImage: "radial-gradient(50% 70% at 100% 0%, rgba(246,184,32,.22), transparent 70%), radial-gradient(40% 60% at 0% 100%, rgba(168,230,207,.14), transparent 70%)" }}>
            <div aria-hidden className="absolute inset-0 -z-10 opacity-[.06]" style={{ backgroundImage: "radial-gradient(#fff 1.2px, transparent 1.2px)", backgroundSize: "24px 24px" }} />

            <div className="mx-auto max-w-6xl px-5">
                <div className="flex items-center justify-between gap-3 py-4">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" aria-label="Cravy admin"><Logo tone="cream" priority className="h-9 sm:h-11" /></Link>
                        <span className="hidden rounded-pill bg-cream/10 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] ring-1 ring-cream/20 sm:inline">Admin</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href="/" target="_blank" rel="noopener noreferrer" aria-label="View website (opens in a new tab)" className="inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-cream/30 px-4 text-sm font-semibold transition hover:bg-cream/10">
                            <FiExternalLink aria-hidden /><span className="hidden sm:inline">View website</span>
                        </a>
                        <button onClick={onLogout} className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-cream px-4 text-sm font-bold text-forest transition hover:bg-mango"><FiLogOut aria-hidden />Log out</button>
                    </div>
                </div>

                <div className="flex flex-col gap-6 pb-7 pt-3 sm:pt-6 lg:flex-row lg:items-end lg:justify-between">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <p className="text-xs font-bold uppercase tracking-[.2em] text-mango">{today}</p>
                        <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight sm:text-5xl" style={{ color: "inherit" }}>{greet}</h1>
                        <p className="mt-1 text-cream/75">Here is what is happening at Cravy today.</p>
                    </motion.div>
                    <ul className="grid grid-cols-3 gap-2 sm:gap-3 lg:min-w-[27rem]">
                        {chips.map(({ label, value, icon: Icon, hot }, i) => (
                            <motion.li key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                                <button onClick={() => onTab("orders")} className={`relative block h-full w-full rounded-2xl p-3 text-left ring-1 transition hover:-translate-y-0.5 sm:p-4 ${hot ? "bg-mango text-forest ring-mango" : "bg-cream/10 ring-cream/15 hover:bg-cream/15"}`}>
                                    <span className="flex items-center justify-between text-lg sm:text-xl"><Icon aria-hidden />{hot && <span aria-hidden className="h-2.5 w-2.5 animate-pulse rounded-full bg-strawberry" />}</span>
                                    <span className="mt-2 block font-display text-2xl font-extrabold leading-none sm:text-3xl">{value ?? "–"}</span>
                                    <span className="mt-1 block text-[11px] font-semibold leading-tight opacity-80 sm:text-xs">{label}</span>
                                </button>
                            </motion.li>
                        ))}
                    </ul>
                </div>

                <div role="tablist" aria-label="Admin sections" className="-mx-1 flex gap-1 overflow-x-auto border-t border-cream/15 px-1 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {tabs.map(({ id, name, icon: Icon }) => (
                        <button key={id} role="tab" aria-selected={tab === id} onClick={() => onTab(id)}
                            className={`relative inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-pill px-5 text-sm font-bold transition-colors ${tab === id ? "text-forest" : "text-cream/85 hover:bg-cream/10"}`}>
                            {tab === id && <motion.span layoutId="admin-tab-pill" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-pill bg-cream" />}
                            <span className="relative z-10 inline-flex items-center gap-2"><Icon aria-hidden />{name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
}