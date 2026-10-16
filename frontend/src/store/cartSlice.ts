import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartLineInput } from "@/lib/types";

export type CartItem = CartLineInput & {
  key: string; // product + variant + addons, so identical selections merge
  name: string; variantName: string | null; addonNames: string[];
  unitPrice: number; // display only; the server recalculates every price
};

const keyOf = (l: CartLineInput) => `${l.product_id}:${l.variant_id ?? 0}:${[...l.addon_ids].sort().join(",")}`;

const slice = createSlice({
  name: "cart",
  initialState: { items: [] as CartItem[], open: false },
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
    clear: (s) => { s.items = []; },
    setOpen: (s, a: PayloadAction<boolean>) => { s.open = a.payload; },
  },
});

export const { hydrate, addItem, setQty, removeItem, clear, setOpen } = slice.actions;
export default slice.reducer;
