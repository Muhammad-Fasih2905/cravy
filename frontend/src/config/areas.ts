/**
 * Cities and areas offered in the "Where should we deliver?" popup.
 * Only names live here. When a customer picks an area, its map position is looked up (OpenStreetMap) and the server
 * measures the real distance from the shop, so the delivery charge always comes from the fixed km rates.
 * Add or remove areas freely; keep the shop's 10 km delivery radius in mind.
 */
export const CITIES = ["Karachi"] as const;
export type AreaGroup = { label: string; items: string[] };

const blocks = (name: string, n: number) => Array.from({ length: n }, (_, i) => `${name} Block ${i + 1}`);

export const AREA_GROUPS: Record<string, AreaGroup[]> = {
  Karachi: [
    { label: "Gulshan-e-Iqbal", items: blocks("Gulshan-e-Iqbal", 19) },
    { label: "Gulistan-e-Jauhar", items: blocks("Gulistan-e-Jauhar", 20) },
    {
      label: "Nearby areas",
      items: [
        "Abul Hasan Isphahani Road", "Aladdin Park", "Askari 4", "Askari 5", "Azizabad", "Bahadurabad", "Drigh Road", "Federal B Area",
        "Gulzar-e-Hijri", "Johar Mor", "Karachi University", "Liaquatabad", "Malir Cantt", "Model Colony", "Nazimabad", "NIPA Chowrangi",
        "PECHS", "Pehlwan Goth", "Rashid Minhas Road", "Safoora Goth", "Saudabad", "Scheme 33", "Shaheed Millat Road", "Sir Shah Suleman Road",
        "Tariq Road", "University Road",
      ],
    },
  ],
};

export const flatAreas = (city: string) => (AREA_GROUPS[city] ?? []).flatMap((g) => g.items);