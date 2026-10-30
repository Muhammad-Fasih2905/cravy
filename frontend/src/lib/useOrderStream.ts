"use client";
import { useEffect, useRef, useState } from "react";
import { api, upsertAdminOrder, type AdminOrder } from "@/store/api";
import { streamUrl } from "@/lib/adminFetch";
import { useAppDispatch } from "@/store/hooks";

export type StreamState = "connecting" | "live" | "offline";

/**
 * Keeps the admin's order list identical to the database, without refreshing.
 *
 * The server saves every change first and only then publishes it on the stream, so what arrives here is exactly
 * what a page refresh would show. Each event carries the full saved order and is put straight into the list.
 * If the connection drops, the list is fetched again from the API as soon as it is back, and also whenever the
 * tab becomes visible again, so nothing is ever missed.
 */
export function useOrderStream(onNewOrder?: (o: AdminOrder) => void): StreamState {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<StreamState>("connecting");
  const onNew = useRef(onNewOrder);
  onNew.current = onNewOrder;

  useEffect(() => {
    let es: EventSource | null = null;
    let stopped = false;
    let statsTimer: ReturnType<typeof setTimeout> | undefined;

    const refreshStats = () => { clearTimeout(statsTimer); statsTimer = setTimeout(() => dispatch(api.util.invalidateTags(["Stats"])), 250); };
    const resync = () => { dispatch(api.util.invalidateTags(["Orders", "Stats"])); };
    const parse = (ev: MessageEvent): AdminOrder | null => { try { return JSON.parse(ev.data) as AdminOrder; } catch { return null; } };

    const connect = () => {
      if (stopped) return;
      es = new EventSource(streamUrl());
      es.addEventListener("ready", () => { setState("live"); resync(); }); // (re)connected: catch up on anything missed
      es.addEventListener("order.created", (ev) => {
        const o = parse(ev as MessageEvent); if (!o) return;
        dispatch(upsertAdminOrder(o)); refreshStats(); onNew.current?.(o);
      });
      es.addEventListener("order.updated", (ev) => {
        const o = parse(ev as MessageEvent); if (!o) return;
        dispatch(upsertAdminOrder(o)); refreshStats();
      });
      es.onerror = () => {
        setState("offline");
        // The browser retries by itself while the connection is merely lost. If it gave up (for example the
        // login expired), the periodic order fetch in the dashboard reports it and logs the admin out.
        if (es?.readyState === EventSource.CLOSED) { es.close(); setTimeout(connect, 5000); }
      };
    };
    connect();

    const onVisible = () => { if (document.visibilityState === "visible") resync(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", resync);
    return () => {
      stopped = true; clearTimeout(statsTimer); es?.close();
      document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("online", resync);
    };
  }, [dispatch]);

  return state;
}