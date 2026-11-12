import type { StaticImageData } from "next/image";
import vanillaCream from "@/assets/Vanilla_cream_waffle_on_plate.webp";
import strawberryVelvet from "@/assets/Strawberry_velvet_ice_cream_scoop.webp";
import blueberryRoyale from "@/assets/Blueberry_ice_cream_scoop.webp";
import goldenCaramel from "@/assets/Caramel_ice_cream_scoop.webp";
// import chocoLuxe from "@/assets/toppings/choco-luxe.webp";

/**
 * Waffle toppings: free, shown as picture tiles inside every waffle card (Waffle menu only). They are fully hard-coded here:
 * nothing has to exist in the admin panel or the database (no products, no toppings). To add one, add a line below.
 * If a product with the same name still exists in the menu it is hidden from the menu cards and from the admin list.
 */
export type WaffleTopping = { name: string; image?: StaticImageData | string };
export const WAFFLE_TOPPING_LIST: WaffleTopping[] = [
    { name: "Vanilla Cream Waffle", image: vanillaCream },
    { name: "Strawberry Velvet", image: strawberryVelvet },
    { name: "Blueberry Royale", image: blueberryRoyale },
    { name: "Golden Caramel", image: goldenCaramel },
    // { name: "Choco Luxe", image: chocoLuxe },
];

export const WAFFLE_CATEGORY = "waffle"; // the Waffle category (slug or name, any capitals, "waffles" also works)
export const WAFFLE_TOPPINGS = WAFFLE_TOPPING_LIST.map((t: WaffleTopping) => t.name);

const key = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const SET = new Set(WAFFLE_TOPPINGS.map(key));
export const isWaffleTopping = (name: string) => SET.has(key(name));
export const toppingKey = key;
/** "Waffle", "waffle", "waffles", "Waffles" ... all count as the Waffle category. */
export const isWaffleCategory = (s: string) => key(s).replace(/s$/, "") === WAFFLE_CATEGORY;
/** true for a topping product that sits in the Waffle category (it is hidden from the menu cards and from the admin products list). */
export const isHiddenWaffleTopping = (category: string, name: string) => isWaffleCategory(category) && SET.has(key(name));