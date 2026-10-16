import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { Reveal } from "@/components/Reveal";

export function CtaBanner() {
  return (
    <Reveal>
      <section aria-labelledby="cta-h" className="relative overflow-hidden rounded-[2rem] bg-mango px-6 py-14 text-center sm:px-14">
        <span aria-hidden className="absolute -left-10 -top-10 h-40 w-40 animate-float rounded-full bg-strawberry/80" />
        <span aria-hidden className="absolute -bottom-12 right-8 h-48 w-48 animate-float rounded-full bg-forest/90 [animation-delay:1.5s]" />
        <span aria-hidden className="absolute right-1/4 top-6 h-10 w-10 animate-float rounded-full bg-mint [animation-delay:.8s]" />
        <div className="relative">
          <h2 id="cta-h" className="text-4xl sm:text-6xl">Hungry already?</h2>
          <p className="mx-auto mt-3 max-w-md text-lg text-forest/90">Your next favourite scoop, shake or mocktail is a few taps away.</p>
          <Link href="/menu" className="btn-primary group mt-7 gap-2 px-8 text-lg">Start your order<FiArrowRight aria-hidden className="transition group-hover:translate-x-1" /></Link>
        </div>
      </section>
    </Reveal>
  );
}