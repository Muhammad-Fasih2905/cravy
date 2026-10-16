"use client";
import { GiIceCreamCone } from "react-icons/gi";
import { useGetMenuQuery } from "@/store/api";

export function Marquee() {
    const { data } = useGetMenuQuery();
    const words = [...(data?.categories.map((c) => c.name) ?? []), "Fresh", "Chilled", "Your Way"];
    const row = (hidden?: boolean) => (
        <ul aria-hidden={hidden} className="flex shrink-0 items-center gap-8 pr-8">
            {words.map((w, i) => (
                <li key={i} className="flex items-center gap-8 font-display text-2xl font-extrabold uppercase tracking-wide text-forest sm:text-3xl">
                    {w}<GiIceCreamCone aria-hidden className="text-strawberry" />
                </li>
            ))}
        </ul>
    );
    return (
        <div className="-rotate-1 overflow-hidden bg-mango py-4 shadow-card" role="marquee" aria-label="Our menu categories">
            <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">{row()}{row(true)}</div>
        </div>
    );
}