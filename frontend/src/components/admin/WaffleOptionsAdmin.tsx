"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { FiArrowDown, FiArrowUp, FiEye, FiEyeOff, FiImage, FiPlus, FiTrash2 } from "react-icons/fi";
import { GiIceCreamCone } from "react-icons/gi";
import { PUBLIC_API as API } from "@/lib/config";
import {
  useAdminAddToppingMutation, useAdminDeleteToppingMutation, useAdminPatchToppingMutation, useAdminToppingImageMutation, useAdminToppingsQuery,
  type AdminTopping,
} from "@/store/api";
import { fallbackToppingImage } from "@/config/waffleFlavours";
import { confirmToast, notify } from "@/lib/notify";

const apiError = (e: unknown) => {
  const d = (e as { data?: { detail?: unknown } })?.data?.detail;
  return typeof d === "string" ? d : "Something went wrong. Please try again.";
};
const input = "min-h-[44px] w-full rounded-2xl border-2 border-vanilla-deep bg-white px-4";

function ToppingRow({ t, index, count, all }: { t: AdminTopping; index: number; count: number; all: AdminTopping[] }) {
  const [patch] = useAdminPatchToppingMutation();
  const [del] = useAdminDeleteToppingMutation();
  const [img, { isLoading: uploading }] = useAdminToppingImageMutation();
  const [name, setName] = useState(t.name);
  const file = useRef<HTMLInputElement>(null);
  const pic = t.image_url ? (t.image_url.startsWith("http") ? t.image_url : `${API}${t.image_url}`) : fallbackToppingImage(t.name);
  const run = async (p: Promise<unknown> & { unwrap?: () => Promise<unknown> }) => { try { await (p.unwrap ? p.unwrap() : p); } catch (e) { notify.error(apiError(e)); } };
  const move = (dir: -1 | 1) => {
    const other = all[index + dir];
    if (!other) return;
    // swap the two positions
    void run(patch({ id: t.id, sort_order: other.sort_order === t.sort_order ? t.sort_order + dir : other.sort_order }));
    void run(patch({ id: other.id, sort_order: t.sort_order === other.sort_order ? other.sort_order - dir : t.sort_order }));
  };
  return (
    <li className={`flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-card ${t.is_available ? "" : "opacity-60"}`}>
      <button type="button" onClick={() => file.current?.click()} aria-label={`Change photo of ${t.name}`} className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-vanilla to-mint text-forest/50">
        {pic ? <Image src={pic} alt="" fill sizes="64px" className="object-cover" unoptimized={typeof pic === "string" && API.includes("localhost")} /> : <GiIceCreamCone size={26} />}
        <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-tl-lg bg-forest text-cream"><FiImage size={13} /></span>
      </button>
      <input ref={file} type="file" accept="image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void run(img({ id: t.id, file: f })); }} />
      <div className="min-w-[10rem] flex-1">
        <input className={input} value={name} maxLength={60} aria-label="Name" onChange={(e) => setName(e.target.value)}
          onBlur={() => { const n = name.trim(); if (!n) setName(t.name); else if (n !== t.name) void run(patch({ id: t.id, name: n })); }} />
        <p className="mt-1 text-xs text-ink/60">{uploading ? "Uploading…" : "Tap the picture to change it (WebP only)."}{t.image_url ? <> <button type="button" className="underline" onClick={() => void run(img({ id: t.id, file: null }))}>Remove photo</button></> : null}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" disabled={index === 0} onClick={() => move(-1)} aria-label="Move up" className="grid h-10 w-10 place-items-center rounded-full bg-vanilla text-forest disabled:opacity-30"><FiArrowUp /></button>
        <button type="button" disabled={index === count - 1} onClick={() => move(1)} aria-label="Move down" className="grid h-10 w-10 place-items-center rounded-full bg-vanilla text-forest disabled:opacity-30"><FiArrowDown /></button>
        <button type="button" onClick={() => void run(patch({ id: t.id, is_available: !t.is_available }))} className="chip min-h-[40px] gap-1.5" aria-pressed={t.is_available}>
          {t.is_available ? <><FiEye /> Shown</> : <><FiEyeOff /> Hidden</>}
        </button>
        <button type="button" aria-label={`Delete ${t.name}`} className="grid h-10 w-10 place-items-center rounded-full text-strawberry hover:bg-strawberry/10"
          onClick={async () => { if (await confirmToast(`Delete "${t.name}"? Old orders keep their text.`)) void run(del(t.id)); }}><FiTrash2 /></button>
      </div>
    </li>
  );
}

function Section({ kind, title, hint, placeholder, items, loading }: {
  kind: "TOPPING" | "ICECREAM"; title: string; hint: string; placeholder: string; items: AdminTopping[]; loading: boolean;
}) {
  const [add, { isLoading: adding }] = useAdminAddToppingMutation();
  const [name, setName] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    try { await add({ name: n, kind }).unwrap(); setName(""); } catch (err) { notify.error(apiError(err)); }
  };
  return (
    <section>
      <h2 className="text-2xl">{title}</h2>
      <p className="mb-4 text-sm text-ink/70">{hint}</p>
      <form onSubmit={submit} className="mb-4 flex gap-2">
        <input className={input} placeholder={placeholder} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-label={placeholder} />
        <button type="submit" disabled={adding || !name.trim()} className="btn-primary min-h-[44px] shrink-0 gap-1.5 px-5 disabled:opacity-50"><FiPlus /> Add</button>
      </form>
      {loading ? <p className="text-ink/60">Loading…</p> : items.length === 0 ? <p className="rounded-2xl bg-white p-5 text-ink/70">Nothing here yet. Add the first one above.</p> : (
        <ul className="space-y-2.5">{items.map((t, i) => <ToppingRow key={t.id + ":" + t.name} t={t} index={i} count={items.length} all={items} />)}</ul>
      )}
    </section>
  );
}

/** Admin tab: the free waffle toppings and the free ice-cream flavours (add, rename, photo, show/hide, order, delete). Nothing here has a price. */
export function WaffleOptionsAdmin() {
  const { data = [], isLoading } = useAdminToppingsQuery();
  const toppings = data.filter((t) => t.kind !== "ICECREAM");
  const flavours = data.filter((t) => t.kind === "ICECREAM");
  return (
    <div className="space-y-10">
      <Section kind="TOPPING" title="Waffle toppings" loading={isLoading} items={toppings} placeholder="New topping name, e.g. Nutella"
        hint="Step 1 after tapping Add on any waffle. Free, no price. Changes go live straight away." />
      <Section kind="ICECREAM" title="Ice-cream flavours for waffles" loading={isLoading} items={flavours} placeholder="New flavour name, e.g. Kiwi"
        hint="Step 2: the customer picks from these, free, no price. Add a photo for each flavour (tap the picture, WebP). The number of free scoops comes from the waffle size name, e.g. “With Ice Cream (2 Scoops)”; “Without Ice Cream” skips this step. These are separate from the Ice Cream menu products." />
    </div>
  );
}