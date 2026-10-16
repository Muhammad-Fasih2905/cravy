"use client";
import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore, type RootState } from "@/store";
import { hydrate } from "@/store/cartSlice";

const CART_KEY = "cravy-cart-v1";

export function StoreProvider({ preloadedState, children }: { preloadedState: RootState; children: React.ReactNode }) {
  const ref = useRef<AppStore>();
  if (!ref.current) ref.current = makeStore(preloadedState);
  const store = ref.current;

  useEffect(() => {
    // Load the saved cart after mount (avoids a server/client HTML mismatch), then keep it saved.
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) store.dispatch(hydrate(JSON.parse(saved)));
    } catch {}
    return store.subscribe(() => {
      try { localStorage.setItem(CART_KEY, JSON.stringify(store.getState().cart.items)); } catch {}
    });
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
