import Image from "next/image";
import { cn } from "@/lib/utils";
import logo from "@/assets/CravyLogoNavbar.webp";

/**
 * The Cravy logo, used exactly as supplied: src/assets/CravyLogo.jpeg (not edited, recoloured or re-drawn).
 * The JPEG is a square with the wordmark in the middle, so this component only *frames* it (crops the empty margin).
 *  - default: tight crop. Use it on dark green backgrounds (footer, admin header) where the artwork's own green blends in.
 *  - framed: a little breathing room around the wordmark, rounded corners and a soft shadow, so it reads as a
 *    deliberate badge on light backgrounds (the cream navbar).
 * Set the size with a height class, e.g. "h-12". (`tone` is kept so older <Logo tone="cream" /> calls still compile.)
 */
const TIGHT = { x: 86, y: 375, w: 1043, h: 615 }; // wordmark area inside the 1254 x 1254 artwork, in pixels
const FRAMED = { x: 6, y: 305, w: 1203, h: 755 }; // same wordmark with ~7-9% green margin on every side

export function Logo({ className, priority = false, framed = false }: { className?: string; tone?: "forest" | "cream"; priority?: boolean; framed?: boolean }) {
  const c = framed ? FRAMED : TIGHT;
  return (
    <span
      className={cn(
        "relative inline-block h-10 shrink-0 select-none overflow-hidden bg-forest",
        framed ? "rounded-2xl shadow-[0_10px_24px_-10px_rgba(5,52,45,.6)] ring-1 ring-forest/20" : "rounded-lg sm:rounded-xl",
        className,
      )}
      style={{ aspectRatio: `${c.w} / ${c.h}` }}
    >
      <Image
        src={logo}
        alt="Cravy"
        priority={priority}
        sizes="(max-width: 640px) 160px, 260px"
        className="absolute max-w-none"
        style={{ width: `${(logo.width / c.w) * 100}%`, height: "auto", left: `${(-c.x / c.w) * 100}%`, top: `${(-c.y / c.h) * 100}%` }}
      />
    </span>
  );
}