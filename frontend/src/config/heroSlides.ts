import type { StaticImageData } from "next/image";
import sliderImage1 from "@/assets/sliderImage1.webp";
import sliderImage2 from "@/assets/sliderImage2.webp";
import sliderImage3 from "@/assets/sliderImage3.webp";
import sliderImage4 from "@/assets/sliderImage4.webp";
// ^ If your files are .jpg / .jpeg / .png, change the ending of these four lines to match. Nothing else needs to change.

/**
 * Slides of the banner slider on the home page. Edit the images, links and text here.
 *
 * PHOTO SLIDES (what you use now): put the picture in src/assets and import it above. The picture is shown whole, never cropped,
 * and the slider takes its height from the picture's own proportions, so it stays sharp and correctly sized on every screen.
 * - All slides should have the same proportions (same width x height), otherwise the slider height follows the FIRST slide
 *   and any different picture is trimmed a little at the edges.
 * - Optional `mobileImage`: a separate, taller/closer-cropped version used on phones (below 640px). Use it if the wide
 *   banner's text becomes too small on a phone. Same rule: all mobile versions should share the same proportions.
 * - `alt` describes the picture for screen readers and Google. `href` is where the slide goes when it is tapped.
 *
 * ILLUSTRATION SLIDES (optional): leave out `image` and fill eyebrow/title/accent/text/cta/bg/tone/art instead.
 */
export type HeroSlide = {
  id: string;
  image?: StaticImageData;
  mobileImage?: StaticImageData;
  alt?: string;
  href?: string;
  // illustration-only fields
  eyebrow?: string;
  title?: string;
  accent?: string;
  text?: string;
  cta?: { label: string; href: string };
  bg?: string;
  tone?: "light" | "dark";
  art?: "cone" | "shake" | "cocktail";
};

export const HERO_SLIDES: HeroSlide[] = [
  { id: "slide-1", image: sliderImage1, alt: "Cravy offer 1", href: "/menu" },
  { id: "slide-2", image: sliderImage2, alt: "Cravy offer 2", href: "/menu" },
  { id: "slide-3", image: sliderImage3, alt: "Cravy offer 3", href: "/menu" },
  { id: "slide-4", image: sliderImage4, alt: "Cravy offer 4", href: "/menu" },
];