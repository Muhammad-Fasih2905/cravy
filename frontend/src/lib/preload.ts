import { cache } from "react";
import { api } from "@/store/api";
import { makeStore } from "@/store";

/**
 * Runs on the server once per request: fills a Redux store with the menu and settings,
 * then returns its state. The client starts with this state, so data is already there
 * on first paint (no spinner, no extra API call, and the HTML is indexable for SEO).
 */
export const getPreloadedState = cache(async () => {
  const store = makeStore();
  await Promise.allSettled([
    store.dispatch(api.endpoints.getMenu.initiate()),
    store.dispatch(api.endpoints.getSettings.initiate()),
    store.dispatch(api.endpoints.getZones.initiate()),
  ]);
  return store.getState();
});
