"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiAlertCircle, FiCheck, FiChevronDown, FiCrosshair, FiLoader, FiTruck, FiX } from "react-icons/fi";
import logo from "@/assets/CravyLogoNavbar.webp";
import { AREA_GROUPS, CITIES, flatAreas } from "@/config/areas";
import { FALLBACK_RATES, MAX_DELIVERY_KM } from "@/lib/delivery";
import {
  closeLocationModal, estimateDelivery, geocodeArea, openLocationModal, reverseGeocode, saveLocation, useLocationModalOpen, useSavedLocation,
} from "@/lib/location";
import { formatPKR } from "@/lib/money";
import { useGetDeliveryRatesQuery } from "@/store/api";

const DETECTED = "__detected__";
type Detected = { latitude: number; longitude: number; area: string; address?: string };
type Geo = "idle" | "fetching" | "ok" | "denied" | "error";
const selectCls = "h-12 w-full appearance-none rounded-2xl border-2 border-vanilla-deep bg-white pl-4 pr-11 text-base font-medium text-forest transition focus-visible:border-forest focus-visible:outline-none";

export function LocationModal() {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const open = useLocationModalOpen();
  const saved = useSavedLocation();
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const { data: ratesData } = useGetDeliveryRatesQuery();
  const rates = ratesData?.rates ?? FALLBACK_RATES;

  const [city, setCity] = useState<string>(CITIES[0]);
  const [area, setArea] = useState("");
  const [detected, setDetected] = useState<Detected | null>(null);
  const [geo, setGeo] = useState<Geo>("idle");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  /* 1. No location yet: open by itself and stay open until one is confirmed (not on an order-tracking page). */
  useEffect(() => {
    if (saved) return;
    if (pathname?.startsWith("/order")) return;
    const t = setTimeout(openLocationModal, 700);
    return () => clearTimeout(t);
  }, [saved, pathname]);

  /* 2. Auto-detect the current location, then let the customer adjust it. */
  async function locate() {
    setMsg("");
    if (typeof navigator === "undefined" || !navigator.geolocation) { setGeo("error"); setMsg("Your browser can't share its location. Please choose your area below."); return; }
    try {
      const p = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
      if (p?.state === "denied") { setGeo("denied"); setMsg("Location access is blocked for this site. Choose your area below, or allow it in your browser settings."); return; }
    } catch { /* the Permissions API is not available everywhere */ }
    setGeo("fetching");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        const r = await reverseGeocode(latitude, longitude, ctrl.signal);
        clearTimeout(timer);
        setDetected({ latitude, longitude, area: r.area ?? "Current location", address: r.address ?? undefined });
        setArea(DETECTED);
        setGeo("ok");
      },
      (err) => { setGeo(err.code === 1 ? "denied" : "error"); setMsg(err.code === 1 ? "Location permission was denied. Choose your area below." : "We couldn't get your location. Choose your area below."); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  /* 3. Set up the form each time the popup opens. */
  useEffect(() => {
    if (!open) return;
    const s = savedRef.current;
    setMsg(""); setSaving(false);
    setCity(s && (CITIES as readonly string[]).includes(s.city) ? s.city : CITIES[0]);
    if (s) {
      setGeo("idle");
      const listed = flatAreas(s.city).includes(s.area);
      if (!listed && s.latitude != null && s.longitude != null) { setDetected({ latitude: s.latitude, longitude: s.longitude, area: s.area, address: s.address }); setArea(DETECTED); }
      else { setDetected(null); setArea(listed ? s.area : ""); }
    } else {
      setDetected(null); setArea("");
      void locate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* 4. Keyboard, scroll lock, focus. */
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (savedRef.current) closeLocationModal(); return; } // required until a location is chosen
      if (e.key !== "Tab" || !dialogRef.current) return;
      const f = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), select, a[href]"));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => dialogRef.current?.focus(), 60);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener("keydown", onKey); clearTimeout(t); prevFocus?.focus?.(); };
  }, [open]);

  const close = () => { if (saved) closeLocationModal(); }; // cannot be dismissed until a location has been confirmed
  const est = detected && area === DETECTED ? estimateDelivery(detected.latitude, detected.longitude, rates) : null;

  async function confirm() {
    if (!area || saving) return;
    setSaving(true); setMsg("");
    if (area === DETECTED && detected) {
      saveLocation({ city, area: detected.area, latitude: detected.latitude, longitude: detected.longitude, address: detected.address ?? `${detected.area}, ${city}`, source: "auto" });
    } else {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 7000);
      const pt = await geocodeArea(area, city, ctrl.signal);
      clearTimeout(timer);
      saveLocation({ city, area, latitude: pt?.latitude ?? null, longitude: pt?.longitude ?? null, address: `${area}, ${city}`, source: "manual" });
    }
    closeLocationModal();
    setSaving(false);
  }

  const locateLabel = geo === "fetching" ? "Fetching your location…" : geo === "ok" ? "Location detected · tap to refresh" : "Use current location";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div aria-hidden className="absolute inset-0 bg-forest/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="loc-title" tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 56, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: 56 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-cream shadow-[0_30px_80px_-20px_rgba(0,0,0,.65)] outline-none sm:max-h-[min(46rem,calc(100dvh-2rem))] sm:max-w-[27rem] sm:rounded-[1.75rem]"
          >
            {/* brand header */}
            <div className="relative shrink-0 overflow-hidden bg-forest px-5 pb-6 pt-7 text-center text-cream">
              <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mango/25 blur-2xl" />
              <div aria-hidden className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
              {saved && <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-cream/15 text-xl text-cream transition hover:bg-cream/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mango"><FiX aria-hidden /></button>}
              <div className="relative mx-auto grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-cream/10 ring-1 ring-cream/25">
                <Image src={logo} alt="Cravy" priority sizes="80px" className="h-14 w-auto max-w-[3.75rem] object-contain" />
              </div>
              <h2 id="loc-title" className="relative mt-4 font-display text-2xl font-extrabold leading-tight sm:text-[1.7rem]" style={{ color: "inherit" }}>Where should we deliver?</h2>
              <p className="relative mt-1 text-sm text-cream/75">Pick your area to see your delivery charge.</p>
            </div>

            {/* form */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-ink/60">Order type</p>
                <span className="inline-flex items-center gap-2 rounded-pill bg-forest px-5 py-2.5 text-sm font-bold text-cream"><FiTruck aria-hidden />Delivery<FiCheck aria-hidden className="text-mango" /></span>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-ink/60">Your location</p>
                <button type="button" onClick={() => void locate()} disabled={geo === "fetching"}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-forest/20 bg-white px-4 font-semibold text-forest transition hover:border-forest hover:bg-forest-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 disabled:cursor-wait disabled:opacity-80">
                  {geo === "fetching" ? <FiLoader aria-hidden className="animate-spin" /> : geo === "ok" ? <FiCheck aria-hidden className="text-forest" /> : <FiCrosshair aria-hidden />}
                  {locateLabel}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="loc-city" className="mb-1.5 block text-sm font-semibold text-forest">Select city / region</label>
                  <div className="relative">
                    <select id="loc-city" value={city} onChange={(e) => { setCity(e.target.value); setArea(detected ? DETECTED : ""); }} className={selectCls}>
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <FiChevronDown aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-forest" />
                  </div>
                </div>
                <div>
                  <label htmlFor="loc-area" className="mb-1.5 block text-sm font-semibold text-forest">Select area / sub region</label>
                  <div className="relative">
                    <select id="loc-area" value={area} onChange={(e) => setArea(e.target.value)} className={selectCls}>
                      <option value="" disabled>Choose your area</option>
                      {detected && <option value={DETECTED}>{`${detected.area} (current location)`}</option>}
                      {(AREA_GROUPS[city] ?? []).map((g) => <optgroup key={g.label} label={g.label}>{g.items.map((a) => <option key={a} value={a}>{a}</option>)}</optgroup>)}
                    </select>
                    <FiChevronDown aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-forest" />
                  </div>
                </div>
              </div>

              <div aria-live="polite" className="space-y-2">
                {msg && <p className="flex items-start gap-2 rounded-2xl bg-strawberry/10 p-3 text-sm text-strawberry"><FiAlertCircle aria-hidden className="mt-0.5 shrink-0 text-base" />{msg}</p>}
                {est && (est.inRange ? (
                  <p className="flex items-start gap-2 rounded-2xl bg-forest-100 p-3 text-sm text-forest"><FiTruck aria-hidden className="mt-0.5 shrink-0 text-base" /><span>About <strong>{est.km.toFixed(1)} km</strong> from our shop · <strong>{est.charge === 0 ? "Free delivery" : `${formatPKR(est.charge ?? 0)} delivery`}</strong></span></p>
                ) : (
                  <p className="flex items-start gap-2 rounded-2xl bg-strawberry/10 p-3 text-sm text-strawberry"><FiAlertCircle aria-hidden className="mt-0.5 shrink-0 text-base" />This spot is about {est.km.toFixed(1)} km from our shop. We deliver within {MAX_DELIVERY_KM} km, so please pick an area closer to us.</p>
                ))}
              </div>
            </div>

            {/* action */}
            <div className="shrink-0 border-t border-vanilla-deep/60 bg-cream px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <button type="button" onClick={() => void confirm()} disabled={!area || saving || geo === "fetching"}
                className="btn w-full min-h-[52px] gap-2 bg-forest text-base text-cream transition-colors duration-300 hover:bg-mango hover:text-forest focus-visible:ring-mango disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink/40 disabled:hover:bg-ink/15 disabled:hover:text-ink/40">
                {saving ? <><FiLoader aria-hidden className="animate-spin" />Saving…</> : "Confirm location"}
              </button>
              <p className="mt-2.5 text-center text-xs text-ink/60">We deliver within {MAX_DELIVERY_KM} km of our shop. Your delivery address is filled in from the location you choose.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}