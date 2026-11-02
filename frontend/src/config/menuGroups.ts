/**
 * The menu page is organised as  MENU (heading)  ->  its categories (sub-headings)  ->  products.
 * The server only sends flat categories, so this file says which category belongs under which menu heading.
 * To move a category, just change the slug lists below. A category not listed here still shows up,
 * under the "More" heading, so nothing ever disappears from the menu.
 */
export type MenuGroup = { id: string; name: string; slugs: string[] };

export const MENU_GROUPS: MenuGroup[] = [
  { id: "ice-creams", name: "Ice Creams", slugs: ["ice-cream"] },
  { id: "shakes", name: "Shakes", slugs: ["ice-cream-shakes", "milk-shakes"] },
  { id: "drinks", name: "Drinks", slugs: ["margaritas", "mocktails", "coladas", "fresh-juices", "soda"] },
];

export const OTHER_GROUP: MenuGroup = { id: "more", name: "More", slugs: [] };

/** Arranges the server's flat categories under their menu headings. Empty headings are dropped; unlisted categories go under "More". */
export function groupCategories<C extends { slug: string }>(cats: C[]): { id: string; name: string; cats: C[] }[] {
  const placed = new Set<string>();
  const out = MENU_GROUPS.map((g) => {
    const mine = g.slugs.map((s) => cats.find((c) => c.slug === s)).filter((c): c is C => !!c);
    mine.forEach((c) => placed.add(c.slug));
    return { id: g.id, name: g.name, cats: mine };
  });
  const rest = cats.filter((c) => !placed.has(c.slug));
  if (rest.length) out.push({ id: OTHER_GROUP.id, name: OTHER_GROUP.name, cats: rest });
  return out.filter((g) => g.cats.length > 0);
}