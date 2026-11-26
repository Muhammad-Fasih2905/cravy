import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartLineInput } from "@/lib/types";

export type FlavourPick = { id: number; qty: number };

export type CartItem = CartLineInput & {
  key: string; // product + variant + addons + free choices, so identical selections merge
  name: string; variantName: string | null; addonNames: string[];
  unitPrice: number; // display only; the server recalculates every price
  /** Free waffle choices (never priced): topping ids and ice-cream flavours with their scoop counts. Names are for display only. */
  toppings?: number[];
  flavours?: FlavourPick[];
  freeToppings?: string[];
};

/** The part of a cart line the server needs (ids and quantities only). Use it everywhere a quote or an order is sent. */
export const toLine = (i: CartItem): CartLineInput & { toppings?: number[]; flavours?: FlavourPick[] } => ({
  product_id: i.product_id, variant_id: i.variant_id, addon_ids: i.addon_ids, quantity: i.quantity,
  ...(i.toppings?.length ? { toppings: i.toppings } : {}),
  ...(i.flavours?.length ? { flavours: i.flavours } : {}),
});

const keyOf = (l: Omit<CartItem, "key">) =>
  `${l.product_id}:${l.variant_id ?? 0}:${[...l.addon_ids].sort().join(",")}:t${[...(l.toppings ?? [])].sort().join(",")}:f${[...(l.flavours ?? [])].sort((a, b) => a.id - b.id).map((f) => `${f.id}x${f.qty}`).join(",")}`;

const slice = createSlice({
  name: "cart",
  initialState: { items: [] as CartItem[], open: false, coupon: null as string | null },
  reducers: {
    hydrate: (s, a: PayloadAction<CartItem[]>) => { s.items = a.payload; },
    addItem: (s, a: PayloadAction<Omit<CartItem, "key">>) => {
      const key = keyOf(a.payload);
      const found = s.items.find((i) => i.key === key);
      if (found) found.quantity = Math.min(50, found.quantity + a.payload.quantity);
      else s.items.push({ ...a.payload, key });
      s.open = true;
    },
    setQty: (s, a: PayloadAction<{ key: string; quantity: number }>) => {
      const i = s.items.find((x) => x.key === a.payload.key);
      if (i) i.quantity = Math.max(1, Math.min(50, a.payload.quantity));
    },
    removeItem: (s, a: PayloadAction<string>) => { s.items = s.items.filter((i) => i.key !== a.payload); },
    clear: (s) => { s.items = []; s.coupon = null; },
    setCoupon: (s, a: PayloadAction<string | null>) => { s.coupon = a.payload; },
    setOpen: (s, a: PayloadAction<boolean>) => { s.open = a.payload; },
  },
});

export const { hydrate, addItem, setQty, removeItem, clear, setOpen, setCoupon } = slice.actions;
export default slice.reducer;