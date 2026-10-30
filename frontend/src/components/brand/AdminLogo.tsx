import Image from "next/image";
import { cn } from "@/lib/utils";
import logo from "@/assets/CravyLogoNavbar.webp";

export function AdminLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={logo}
      alt="Cravy"
      priority={priority}
      sizes="260px"
      className={cn("h-10 w-auto shrink-0 select-none rounded-lg bg-forest object-contain sm:rounded-xl", className)}
    />
  );
}