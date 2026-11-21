"use client";
import { useEffect, useState } from "react";

/**
 * Shop timing: open every day from 2:00 PM to 2:00 AM (the next morning).
 * Always measured in Karachi time, so a customer abroad or with a wrong phone clock sees the shop's real status.
 * To change the timing, edit these three lines only.
 */
export const SHOP_TZ = "Asia/Karachi";
export const OPEN_MINUTES = 14 * 60; // 2:00 PM
export const CLOSE_MINUTES = 2 * 60; // 2:00 AM (next day)

export type ShopStatus = { open: boolean; note: string };

const label = (mins: number) => {
    const h24 = Math.floor(mins / 60) % 24, m = mins % 60;
    return `${h24 % 12 || 12}:${String(m).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`;
};

const SHOP_UTC_OFFSET_MIN = 5 * 60; // Karachi is UTC+5 all year (Pakistan has no daylight saving)

/** Minutes since midnight, right now, in the shop's time zone. Plain arithmetic on the UTC clock, so a browser's date formatting cannot get it wrong. */
function minutesNow(now: Date): number {
    return (now.getUTCHours() * 60 + now.getUTCMinutes() + SHOP_UTC_OFFSET_MIN) % 1440;
}

export function shopStatus(now = new Date()): ShopStatus {
    const t = minutesNow(now);
    // The open window crosses midnight (2 PM -> 2 AM), so "open" is "after opening OR before closing".
    const open = OPEN_MINUTES > CLOSE_MINUTES ? t >= OPEN_MINUTES || t < CLOSE_MINUTES : t >= OPEN_MINUTES && t < CLOSE_MINUTES;
    return { open, note: open ? `Open until ${label(CLOSE_MINUTES)}` : `Opens at ${label(OPEN_MINUTES)}` };
}

/** Live status. null on the server and during hydration (no flash of a wrong state); then re-checked every 30 seconds. */
export function useShopStatus(): ShopStatus | null {
    const [s, setS] = useState<ShopStatus | null>(null);
    useEffect(() => {
        const tick = () => setS((prev) => { const n = shopStatus(); return prev && prev.open === n.open && prev.note === n.note ? prev : n; });
        tick();
        const id = setInterval(tick, 15_000);
        // a phone that slept, a tab that was in the background or a page restored from the back/forward cache: re-check at once
        document.addEventListener("visibilitychange", tick);
        window.addEventListener("focus", tick);
        window.addEventListener("pageshow", tick);
        window.addEventListener("online", tick);
        return () => {
            clearInterval(id);
            document.removeEventListener("visibilitychange", tick);
            window.removeEventListener("focus", tick);
            window.removeEventListener("pageshow", tick);
            window.removeEventListener("online", tick);
        };
    }, []);
    return s;
}