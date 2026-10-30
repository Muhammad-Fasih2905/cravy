"use client";
import { useEffect } from "react";
import { api, useGetMenuQuery } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { MENU_POLL_MS, onMenuChange } from "@/lib/menuSync";

/**
 * Keeps the menu on every page identical to the database, without a refresh.
 * - asks the server again every few seconds while the page is open and visible,
 * - refreshes at once when the tab is focused again or the connection comes back,
 * - refreshes at once when the admin saves something in another tab of this browser.
 * Prices, discounts, photos, new and removed products all come from this one menu.
 */
export function LiveMenu() {
  const dispatch = useAppDispatch();
  useGetMenuQuery(undefined, { pollingInterval: MENU_POLL_MS, skipPollingIfUnfocused: true, refetchOnFocus: true, refetchOnReconnect: true });
  useEffect(() => onMenuChange(() => { dispatch(api.util.invalidateTags(["Menu"])); }), [dispatch]);
  return null;
}