"use client";
import { usePathname } from "next/navigation";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

/** Shows the customer-facing header, footer and cart everywhere except the admin panel. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    if (pathname === "/admin" || pathname?.startsWith("/admin/")) return <>{children}</>;
    return (
        <>
            <Navbar />
            {children}
            <Footer />
            <CartDrawer />
        </>
    );
}