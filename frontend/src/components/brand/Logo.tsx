import { cn } from "@/lib/utils";

/** Temporary Cravy wordmark in the brand palette. Replace with the official logo file when available. */
export function Logo({ className, tone = "forest" }: { className?: string; tone?: "forest" | "cream" }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display text-3xl font-extrabold tracking-tight",
        tone === "forest" ? "text-forest" : "text-cream",
        className,
      )}
      aria-label="Cravy"
    >
      Crav<span className="text-strawberry">y</span>
      <span aria-hidden className="ml-1 inline-block h-2.5 w-2.5 rounded-full bg-mango" />
    </span>
  );
}
