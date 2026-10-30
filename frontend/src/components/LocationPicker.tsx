"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiCrosshair, FiLoader, FiMapPin } from "react-icons/fi";
import { MAP_DEFAULT_CENTER } from "@/lib/config";
import type { LatLng } from "@/lib/types";

const PIN = `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17 43C17 43 32 27.5 32 16.5 32 8 25.3 1.5 17 1.5S2 8 2 16.5C2 27.5 17 43 17 43Z" fill="#E5384F" stroke="#05342D" stroke-width="2"/><circle cx="17" cy="16.5" r="6" fill="#fff"/></svg>`;

/**
 * The customer drops a pin where the order should be delivered: tap the map, drag the pin, or use their current
 * location. Only the coordinates leave this component. The server measures the distance and sets the delivery charge.
 */
export function LocationPicker({ value, onChange, invalid }: { value: LatLng | null; onChange: (v: LatLng) => void; invalid?: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const lib = useRef<typeof import("leaflet") | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const place = (lat: number, lng: number, fly = false) => {
    const L = lib.current, m = map.current;
    if (!L || !m) return;
    if (!marker.current) {
      const icon = L.divIcon({ html: PIN, className: "", iconSize: [34, 44], iconAnchor: [17, 43] });
      marker.current = L.marker([lat, lng], { icon, draggable: true, keyboard: true, title: "Delivery location. Drag to adjust." }).addTo(m);
      marker.current.on("dragend", () => { const p = marker.current!.getLatLng(); cb.current({ latitude: p.lat, longitude: p.lng }); });
    } else marker.current.setLatLng([lat, lng]);
    if (fly) m.flyTo([lat, lng], Math.max(m.getZoom(), 16), { duration: 0.6 });
  };

  // create the map once (Leaflet only runs in the browser)
  useEffect(() => {
    let dead = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (dead || !el.current || map.current) return;
      lib.current = L;
      const m = L.map(el.current, { center: value ? [value.latitude, value.longitude] : MAP_DEFAULT_CENTER, zoom: value ? 16 : 13, scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(m);
      m.on("click", (e) => { place(e.latlng.lat, e.latlng.lng); cb.current({ latitude: e.latlng.lat, longitude: e.latlng.lng }); });
      map.current = m;
      if (value) place(value.latitude, value.longitude);
      setTimeout(() => m.invalidateSize(), 0);
    })();
    return () => { dead = true; map.current?.remove(); map.current = null; marker.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the pin in step if the value is changed from outside
  useEffect(() => {
    if (!value || !map.current) return;
    const cur = marker.current?.getLatLng();
    if (!cur || Math.abs(cur.lat - value.latitude) > 1e-7 || Math.abs(cur.lng - value.longitude) > 1e-7) place(value.latitude, value.longitude);
  }, [value]);

  function locate() {
    setGeoError("");
    if (!navigator.geolocation) { setGeoError("Your browser cannot share its location. Tap the map to drop the pin instead."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocating(false); place(p.coords.latitude, p.coords.longitude, true); cb.current({ latitude: p.coords.latitude, longitude: p.coords.longitude }); },
      (err) => { setLocating(false); setGeoError(err.code === 1 ? "Location permission was denied. Tap the map to drop the pin instead." : "Could not get your location. Tap the map to drop the pin instead."); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={locate} disabled={locating} className="btn-secondary min-h-[44px] gap-2 px-4 text-sm">
          {locating ? <FiLoader className="animate-spin" aria-hidden /> : <FiCrosshair aria-hidden />}Use my current location
        </button>
        <span className="flex items-center gap-1 text-sm"><FiMapPin aria-hidden />{value ? "Pin placed. Drag it to fine-tune." : "Or tap the map to drop a pin."}</span>
      </div>
      <div ref={el} role="application" aria-label="Map: tap to set your delivery location"
        className={`h-72 w-full overflow-hidden rounded-2xl border-2 sm:h-80 ${invalid ? "border-strawberry" : "border-vanilla-deep"}`} />
      {geoError && <p role="alert" className="text-sm text-strawberry">{geoError}</p>}
    </div>
  );
}