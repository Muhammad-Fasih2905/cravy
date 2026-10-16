import type { Metadata } from "next";
import { MenuBrowser } from "@/components/MenuBrowser";

export const metadata: Metadata = {
  title: "Menu",
  description: "Browse the Cravy menu: ice creams, coldies, margaritas and mocktails.",
  alternates: { canonical: "/menu" },
};

export default function MenuPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="mb-6 text-4xl">Our Menu</h1>
      <MenuBrowser />
    </main>
  );
}
