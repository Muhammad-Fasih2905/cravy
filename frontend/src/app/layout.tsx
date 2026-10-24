import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import logo from "@/assets/CravyLogo.jpeg";
import { SITE } from "@/config/site";
import { getPreloadedState } from "@/lib/preload";
import { StoreProvider } from "@/components/StoreProvider";
import { SiteChrome } from "@/components/SiteChrome";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${SITE.name}: ${SITE.headline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  icons: { icon: [{ url: logo.src, type: "image/jpeg" }], shortcut: logo.src, apple: logo.src },
  openGraph: { type: "website", siteName: SITE.name, title: SITE.name, description: SITE.description, images: [{ url: logo.src, width: logo.width, height: logo.height, alt: "Cravy" }] },
};
export const viewport: Viewport = { themeColor: "#05342D", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const preloadedState = await getPreloadedState();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <StoreProvider preloadedState={preloadedState}>
          <SiteChrome>{children}</SiteChrome>
        </StoreProvider>
      </body>
    </html>
  );
}