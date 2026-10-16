import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { SITE } from "@/config/site";
import { getPreloadedState } from "@/lib/preload";
import { StoreProvider } from "@/components/StoreProvider";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${SITE.name}: ${SITE.headline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE.name, title: SITE.name, description: SITE.description },
};
export const viewport: Viewport = { themeColor: "#0F3D2E", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const preloadedState = await getPreloadedState();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <StoreProvider preloadedState={preloadedState}>
          <Navbar />
          {children}
          <Footer />
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
