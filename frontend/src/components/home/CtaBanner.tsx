import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { Reveal } from "@/components/Reveal";

export function CtaBanner() {
  return (
    <Reveal>
      <section aria-labelledby="cta-h" className="relative overflow-hidden rounded-[1.5rem] bg-mango px-5 py-9 text-center sm:rounded-[2rem] sm:px-14 sm:py-14">
        <span aria-hidden className="absolute -left-8 -top-8 h-28 w-28 animate-float rounded-full bg-strawberry/80 sm:-left-10 sm:-top-10 sm:h-40 sm:w-40" />
        <span aria-hidden className="absolute -bottom-10 right-4 h-32 w-32 animate-float rounded-full bg-forest/90 [animation-delay:1.5s] sm:-bottom-12 sm:right-8 sm:h-48 sm:w-48" />
        <span aria-hidden className="absolute right-1/4 top-4 h-8 w-8 animate-float rounded-full bg-mint [animation-delay:.8s] sm:top-6 sm:h-10 sm:w-10" />
        <div className="relative">
          <h2 id="cta-h" className="text-3xl sm:text-5xl lg:text-6xl">Hungry already?</h2>
          <p className="mx-auto mt-2 max-w-md text-base text-forest/90 sm:mt-3 sm:text-lg">Your next favourite scoop, shake or mocktail is a few taps away.</p>
          <Link href="/menu" className="btn-primary group mt-5 gap-2 px-7 text-base sm:mt-7 sm:px-8 sm:text-lg">Start your order<FiArrowRight aria-hidden className="transition group-hover:translate-x-1" /></Link>
        </div>
      </section>
    </Reveal>
  );
}