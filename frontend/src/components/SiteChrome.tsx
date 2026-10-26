"use client";
import { usePathname } from "next/navigation";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

/**
 * Shows the customer-facing header, footer and cart everywhere except the admin panel.
 *
 * The navbar is `fixed` (it floats over the page and takes no space), so the page must leave room for it:
 *  - home: the hero is a full-bleed dark section that runs behind the navbar, so only the hero's top padding is raised
 *    (the first <section> inside <main>) and its content starts below the bar;
 *  - every other page: a top offset equal to the bar's height, so headings, forms and the checkout never hide under it.
 * Bar height (incl. its 12px top gap): about 76px on phones, 80px from 640px, 88px from 1024px.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    if (pathname === "/admin" || pathname?.startsWith("/admin/")) return <>{children}</>;
    const home = pathname === "/";
    return (
        <>
            <Navbar />
            <div className={home ? "[&>main>section:first-child]:pt-28 sm:[&>main>section:first-child]:pt-32 lg:[&>main>section:first-child]:pt-36" : "pt-[4.75rem] sm:pt-[5rem] lg:pt-[5.5rem]"}>{children}</div>
            <Footer />
            <CartDrawer />
        </>
    );
}