import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { Categories } from "@/components/home/Categories";
import { CtaBanner } from "@/components/home/CtaBanner";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Marquee } from "@/components/home/Marquee";
import { FAQ } from "@/components/FAQ";
import { MenuBrowser } from "@/components/MenuBrowser";
import { Reveal } from "@/components/Reveal";
import { Testimonials } from "@/components/Testimonials";

export default function Home() {
  return (
    <main>
      <Hero />
      <div className="mx-4 max-w-0xl space-y-14 px-4 pb-6 pt-12 sm:space-y-20 sm:px-5 sm:pb-12 sm:pt-16 lg:space-y-24 lg:py-20">
        <Categories />
        <section aria-labelledby="featured">
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div><p className="chip">Fan favourites</p><h2 id="featured" className="mt-3 text-3xl sm:text-5xl">Featured treats</h2></div>
            <Link href="/menu" className="group inline-flex items-center gap-2 font-bold text-forest">See full menu<FiArrowRight aria-hidden className="transition group-hover:translate-x-1" /></Link>
          </Reveal>
          <MenuBrowser onlyFeatured />
        </section>
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <CtaBanner />
      </div>
    </main>
  );
}