"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FaQuoteLeft } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { REVIEWS } from "@/config/reviews";

const tints = ["bg-mango", "bg-mint", "bg-strawberry text-cream", "bg-vanilla-deep"];
const initials = (n: string) => n.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

export function Testimonials() {
  const rail = useRef<HTMLUListElement>(null);
  if (REVIEWS.length === 0) return null;
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * (rail.current.clientWidth * 0.8), behavior: "smooth" });

  return (
    <section id="reviews" aria-labelledby="reviews-h" className="overflow-hidden rounded-[2rem] bg-vanilla px-5 py-12 sm:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="chip bg-white"><FcGoogle aria-hidden className="mr-2" />Google reviews</p>
          <h2 id="reviews-h" className="mt-3 text-3xl sm:text-4xl">Loved by our customers</h2>
          <p className="mt-1">Real reviews from people who visited Cravy.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} aria-label="Previous reviews" className="grid h-12 w-12 place-items-center rounded-full bg-white text-forest shadow-card transition hover:bg-forest hover:text-cream"><FiChevronLeft size={22} /></button>
          <button onClick={() => scroll(1)} aria-label="Next reviews" className="grid h-12 w-12 place-items-center rounded-full bg-white text-forest shadow-card transition hover:bg-forest hover:text-cream"><FiChevronRight size={22} /></button>
        </div>
      </div>
      <ul ref={rail} className="-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" tabIndex={0} aria-label="Customer reviews">
        {REVIEWS.map((r, i) => (
          <motion.li key={r.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} whileHover={{ y: -6 }}
            className="card flex w-[85%] shrink-0 snap-start flex-col gap-4 p-6 sm:w-[360px]">
            <FaQuoteLeft aria-hidden className="text-2xl text-mango" />
            <blockquote className="flex-1 whitespace-pre-line text-base leading-relaxed">{r.text}</blockquote>
            <footer className="flex items-center gap-3 border-t border-vanilla pt-4">
              <span aria-hidden className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-bold text-forest ${tints[i % tints.length]}`}>{initials(r.name)}</span>
              <div className="min-w-0">
                <a href={r.profileUrl} target="_blank" rel="noopener noreferrer" className="block truncate font-bold text-forest hover:underline">{r.name}</a>
                <p className="truncate text-xs">{r.meta}</p>
              </div>
              <FcGoogle aria-label="Google review" className="ml-auto shrink-0" size={22} />
            </footer>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}