import Link from "next/link";
import { GiIceCreamCone } from "react-icons/gi";
import { FiTruck, FiShield, FiCreditCard } from "react-icons/fi";
import { SITE } from "@/config/site";
import { MenuBrowser } from "@/components/MenuBrowser";
import { FAQ } from "@/components/FAQ";
import { Testimonials } from "@/components/Testimonials";
import { Reveal } from "@/components/Reveal";

const perks = [
  { icon: GiIceCreamCone, title: "Made fresh", text: "Ice creams, coldies and mocktails prepared when you order." },
  { icon: FiTruck, title: "Delivered to you", text: "Order from your phone and track every step." },
  { icon: FiCreditCard, title: "Pay your way", text: "Cash on delivery, Easypaisa or bank transfer." },
  { icon: FiShield, title: "Safe checkout", text: "We never ask for PINs or passwords." },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl space-y-14 px-5 py-8 sm:py-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-forest px-6 py-16 text-cream sm:px-14 sm:py-24">
        <div aria-hidden className="absolute -right-16 -top-16 h-72 w-72 animate-float rounded-full bg-mango/90" />
        <div aria-hidden className="absolute -bottom-20 right-24 h-56 w-56 animate-float rounded-full bg-strawberry/80 [animation-delay:1.5s]" />
        <div aria-hidden className="absolute bottom-10 right-4 h-28 w-28 rounded-full bg-mint" />
        <Reveal className="relative max-w-xl">
          <span className="chip bg-vanilla">Ice creams · Coldies · Margaritas · Mocktails</span>
          <h1 className="mt-5 text-5xl !text-cream sm:text-7xl">{SITE.headline}</h1>
          <p className="mt-5 text-lg text-cream/90">{SITE.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/menu" className="btn bg-mango text-forest shadow-lift hover:bg-vanilla">Order Now</Link>
            <Link href="/menu" className="btn border-2 border-cream text-cream hover:bg-cream hover:text-forest">Explore Our Menu</Link>
          </div>
        </Reveal>
      </section>

      <section aria-label="Why Cravy" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {perks.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 0.08}>
            <div className="card h-full p-6 transition hover:-translate-y-1 hover:shadow-lift"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-vanilla text-2xl text-forest"><Icon aria-hidden /></span>
            <h2 className="mt-4 text-lg">{title}</h2>
            <p className="mt-1 text-sm">{text}</p></div>
          </Reveal>
        ))}
      </section>

      <section aria-labelledby="featured">
        <div className="mb-5 flex items-end justify-between">
          <h2 id="featured" className="text-3xl">Featured</h2>
          <Link href="/menu" className="font-bold text-forest underline">See full menu</Link>
        </div>
        <MenuBrowser onlyFeatured />
      </section>

      <Testimonials />

      <FAQ />
    </main>
  );
}
