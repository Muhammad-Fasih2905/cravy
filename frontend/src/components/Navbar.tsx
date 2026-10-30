"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { FiShoppingBag, FiArrowUpRight } from "react-icons/fi";
import Image from "next/image";
import logo from "@/assets/CravyLogoNavbar.webp";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setOpen } from "@/store/cartSlice";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { label: "Menu", href: "/menu", hint: "Browse everything we make" },
  { label: "Reviews", href: "/#reviews", hint: "What our customers say" },
  { label: "FAQ", href: "/#faq", hint: "Delivery, ordering and more" },
];

export function Navbar() {

  const count = useAppSelector((s) => s.cart.items.reduce((n, i) => n + i.quantity, 0));
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const lastScrollY = useRef(0);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 20);
      if (y > lastScrollY.current && y > 80) {
        setIsVisible(false);
        setIsOpen(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    const onResize = () => window.innerWidth >= 768 && setIsOpen(false); // the full-screen menu is for phones and small tablets
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen]);

  const openCart = () => {
    setIsOpen(false);
    dispatch(setOpen(true));
  };

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-30 px-3 pt-3 transition-transform duration-500 ease-out sm:px-4"
        style={{ transform: isVisible ? "translateY(0)" : "translateY(-120%)" }}
      >
        {/* A floating brand-green bar. It is always green because the logo is light: it stays readable on cream pages,
            over product cards and over the hero. Scrolling makes it denser, more compact and adds a shadow. */}
        <nav
          aria-label="Main"
          className={`relative mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 overflow-hidden rounded-full border px-3 transition-all duration-500 sm:gap-4 sm:px-4 ${isScrolled || isOpen
              ? "border-cream/15 bg-forest/95 py-1.5 shadow-[0_18px_40px_-16px_rgba(0,0,0,.65)] backdrop-blur-xl"
              : "border-cream/10 bg-forest/90 py-2.5 shadow-[0_10px_30px_-18px_rgba(0,0,0,.5)] backdrop-blur-md"
            }`}
        >
          <Link
            href="/"
            aria-label="Cravy home"
            onClick={() => setIsOpen(false)}
            className="col-start-1 shrink-0 justify-self-start rounded-full transition duration-300 hover:-rotate-2 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mango"
          >
            <Image
              src={logo}
              alt="Cravy"
              priority
              sizes="(max-width: 640px) 120px, 180px"
              className={`w-auto max-w-[42vw] object-contain transition-all duration-500 ${isScrolled || isOpen ? "-my-1.5 h-12 sm:-my-2 sm:h-14 lg:-my-3 lg:h-16" : "-my-2 h-14 sm:-my-3 sm:h-[4.5rem] lg:-my-4 lg:h-20"}`}
            />
          </Link>

          {/* Desktop links: perfectly centred, with a sliding mango highlight */}
          <div
            className="col-start-2 hidden items-center gap-0.5 rounded-full bg-cream/[.07] p-1 text-[15px] font-semibold tracking-wide ring-1 ring-cream/10 md:flex xl:text-base"
            onMouseLeave={() => setHovered(null)}
          >
            {LINKS.map((l) => {
              const active = pathname === l.href;
              const hot = hovered === l.label;
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  onMouseEnter={() => setHovered(l.label)}
                  onFocus={() => setHovered(l.label)}
                  onBlur={() => setHovered(null)}
                  className={`relative isolate flex items-center gap-2 rounded-full px-4 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mango lg:px-5 ${hot ? "text-forest" : "text-cream/90"}`}
                >
                  {hot && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-mango shadow-[0_8px_20px_-8px_rgba(246,184,32,.8)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {active && <span aria-hidden className={`h-1.5 w-1.5 rounded-full transition-colors ${hot ? "bg-forest" : "bg-mango"}`} />}
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="col-start-3 flex items-center justify-self-end gap-2">
            {/* Cart: cream button on the green bar, turns mango on hover (the badge stays readable) */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.04 }}
              className="btn group relative min-h-[44px] min-w-[44px] gap-2 bg-cream px-3 text-forest shadow-lift transition-colors duration-300 hover:bg-mango hover:shadow-[0_14px_30px_-10px_rgba(246,184,32,.75)] focus-visible:ring-mango sm:px-5"
              onClick={openCart}
              aria-label={`Open cart, ${count} items`}
            >
              <FiShoppingBag size={20} aria-hidden className="shrink-0 transition-transform duration-300 group-hover:-rotate-12" />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 1.7 }}
                  animate={{ scale: 1 }}
                  className="grid h-6 min-w-6 place-items-center rounded-full bg-forest px-1.5 text-sm font-bold text-mango"
                >
                  {count}
                </motion.span>
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsOpen((o) => !o)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream/10 text-cream ring-1 ring-cream/20 transition-colors duration-300 hover:bg-mango hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mango md:hidden"
            >
              <span className="relative block h-4 w-5">
                <motion.span className="absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current" animate={isOpen ? { y: 7, rotate: 45 } : { y: 0, rotate: 0 }} />
                <motion.span className="absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current" animate={isOpen ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }} />
                <motion.span className="absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current" animate={isOpen ? { y: -7, rotate: -45 } : { y: 0, rotate: 0 }} />
              </span>
            </motion.button>
          </div>
 
        </nav>
      </header>

      {/* Full-screen mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-20 flex flex-col overflow-y-auto bg-forest/[.97] px-6 pb-8 pt-24 backdrop-blur-xl md:hidden"
            initial={{ clipPath: "circle(0% at calc(100% - 46px) 48px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 46px) 48px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 46px) 48px)" }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          >
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-mango/20 blur-3xl" />

            <ul className="relative my-auto flex flex-col gap-1 py-6 sm:gap-2">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.label}
                  initial={{ opacity: 0, y: 36 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.25 + i * 0.08, duration: 0.45 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <Link href={l.href} onClick={() => setIsOpen(false)} className="group flex items-end justify-between border-b border-vanilla/15 py-3 sm:py-4">
                    <span>
                      <span className="block text-[clamp(2.5rem,13vw,3.25rem)] font-extrabold leading-none text-vanilla transition group-hover:text-mango group-active:text-mango">{l.label}</span>
                      <span className="mt-2 block text-sm text-vanilla/60">{l.hint}</span>
                    </span>
                    <FiArrowUpRight size={28} aria-hidden className="mb-1 text-vanilla/40 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-mango" />
                  </Link>
                </motion.li>
              ))}

              <motion.li
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.25 + LINKS.length * 0.08, duration: 0.45 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <button onClick={openCart} className="group flex w-full items-end justify-between py-3 text-left sm:py-4">
                  <span>
                    <span className="block text-[clamp(2.5rem,13vw,3.25rem)] font-extrabold leading-none text-vanilla transition group-hover:text-mango group-active:text-mango">Cart</span>
                    <span className="mt-2 block text-sm text-vanilla/60">
                      {count > 0 ? `${count} ${count === 1 ? "item" : "items"} waiting for you` : "Your cart is empty"}
                    </span>
                  </span>
                  <span className="mb-1 grid h-10 min-w-10 place-items-center rounded-full bg-mango px-3 font-bold text-forest">{count}</span>
                </button>
              </motion.li>
            </ul>

            <motion.div className="relative" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.6 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
              <Link href="/menu" onClick={() => setIsOpen(false)} className="btn flex min-h-[52px] w-full items-center justify-center gap-2 bg-mango text-lg text-forest transition-colors duration-300 hover:bg-cream">
                Start your order
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}