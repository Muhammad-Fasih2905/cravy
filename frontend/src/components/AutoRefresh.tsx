"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-reads the server-rendered page every few seconds while `active`, so the customer sees the admin's update without reloading. */
export function AutoRefresh({ active, every = 10000 }: { active: boolean; every?: number }) {
    const router = useRouter();
    useEffect(() => {
        if (!active) return;
        const tick = () => { if (document.visibilityState === "visible") router.refresh(); };
        const id = setInterval(tick, every);
        document.addEventListener("visibilitychange", tick);
        return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
    }, [active, every, router]);
    return null;
}