"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiImage, FiPlus, FiSave, FiSliders, FiTrash2 } from "react-icons/fi";
import { formatPKR } from "@/lib/money";
import { applyDiscount } from "@/lib/pricing";
import {
  api, useAdminCategoriesQuery, useAdminCreateProductMutation, useAdminDeleteProductMutation, useAdminOptionsQuery,
  useAdminPatchProductMutation, useAdminProductsQuery, useAdminSaveOptionsMutation, useGetMenuQuery,
  type AdminProduct, type OptionRow, type ProductPatch,
} from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { PUBLIC_API as API } from "@/lib/config";
import { announceMenuChange } from "@/lib/menuSync";
import { confirmToast } from "@/lib/notify";
import { Select } from "../Select";

const input = "min-h-[44px] w-full rounded-2xl border-2 border-vanilla-deep bg-white px-4";
const authHeader = () => ({ authorization: `Bearer ${sessionStorage.getItem("cravy-admin") ?? ""}` });
const apiError = (e: unknown) => {
  const d = (e as { data?: { detail?: unknown } })?.data?.detail;
  return typeof d === "string" ? d : "Could not reach the server. Please try again.";
};
const imgSrc = (u: string) => (u.startsWith("http") ? u : `${API}${u}`);

/* ---------------------------------------------------------------- images */
// The server accepts WebP only (max 3 MB). The admin can pick any JPG/PNG/WebP: it is converted and shrunk here in the browser.
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_SIDE = 1400;

async function toWebp(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPG, PNG or WebP).");
  if (file.type === "image/webp" && file.size <= MAX_BYTES) return file;
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(file); } catch { throw new Error("This image could not be read. Try another photo."); }
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bmp.width * k)); canvas.height = Math.max(1, Math.round(bmp.height * k));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot process images.");
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height); bmp.close?.();
  for (const q of [0.86, 0.72, 0.55]) {
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", q));
    if (!blob || blob.type !== "image/webp") throw new Error("This browser cannot convert to WebP. Please choose a .webp file instead.");
    if (blob.size <= MAX_BYTES) return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.webp`, { type: "image/webp" });
  }
  throw new Error("The photo is too large even after compressing. Please use a smaller one.");
}

async function uploadImage(id: number, file: File): Promise<void> {
  const webp = await toWebp(file);
  const fd = new FormData(); fd.append("file", webp);
  const r = await fetch(`${API}/api/admin/products/${id}/image`, { method: "POST", headers: authHeader(), body: fd });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(typeof d?.detail === "string" ? d.detail : "Photo upload failed.");
  }
  announceMenuChange(); // other open tabs of the website pick up the new photo at once
}

/* ------------------------------------------------------- small pieces */
function OptionList({ title, rows, set }: { title: string; rows: OptionRow[]; set: (r: OptionRow[]) => void }) {
  const upd = (i: number, patch: Partial<OptionRow>) => set(rows.map((r, n) => (n === i ? { ...r, ...patch } : r)));
  return (
    <fieldset className="space-y-2">
      <legend className="font-bold text-forest">{title}</legend>
      {rows.length === 0 && <p className="text-sm">None yet.</p>}
      {rows.map((r, i) => (
        <div key={r.id ?? `new-${i}`} className="flex flex-wrap items-center gap-2">
          <input aria-label={`${title} name`} className={`${input} min-w-[140px] flex-1`} value={r.name} onChange={(e) => upd(i, { name: e.target.value })} />
          <input aria-label="Price" type="number" min={0} className={`${input} w-28`} value={r.price} onChange={(e) => upd(i, { price: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-forest" checked={r.is_available} onChange={(e) => upd(i, { is_available: e.target.checked })} />On</label>
          <button type="button" aria-label="Remove" className="grid h-10 w-10 place-items-center rounded-full text-strawberry hover:bg-strawberry/10" onClick={() => set(rows.filter((_, n) => n !== i))}><FiTrash2 /></button>
        </div>
      ))}
      <button type="button" className="btn-secondary min-h-[40px] gap-2 px-4 text-sm" onClick={() => set([...rows, { name: "", price: 0, is_available: true }])}><FiPlus aria-hidden />Add</button>
    </fieldset>
  );
}

function DiscountField({ value, onChange, price }: { value: string; onChange: (v: string) => void; price: number }) {
  const pct = Math.max(0, Math.min(90, Math.round(Number(value) || 0)));
  return (
    <label className="text-sm">Discount (%)
      <input type="number" min={0} max={90} step={1} inputMode="numeric" placeholder="0" className={`${input} w-28`} value={value} onChange={(e) => onChange(e.target.value)} />
      {pct > 0 && price > 0 && <span className="mt-1 block text-xs font-semibold text-forest">{formatPKR(price)} → {formatPKR(applyDiscount(price, pct))}</span>}
    </label>
  );
}

function PhotoPicker({ file, current, onFile, label = "Photo" }: { file: File | null; current?: string | null; onFile: (f: File | null) => void; label?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const u = URL.createObjectURL(file); setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const shown = url ?? (current ? imgSrc(current) : null);
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-vanilla text-forest/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {shown ? <img src={shown} alt="" className="h-full w-full object-cover" /> : <FiImage aria-hidden size={26} />}
      </div>
      <label className="btn-secondary min-h-[40px] cursor-pointer gap-2 px-4 text-sm"><FiImage aria-hidden />{shown ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
      </label>
    </div>
  );
}

/* -------------------------------------------------- sizes & toppings (existing product) */
function OptionsEditor({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const { data } = useAdminOptionsQuery(id, { skip: !open });
  const [save, { isLoading, isSuccess, error }] = useAdminSaveOptionsMutation();
  const [v, setV] = useState<OptionRow[]>([]); const [a, setA] = useState<OptionRow[]>([]);
  useEffect(() => { if (data) { setV(data.variants); setA(data.addons); } }, [data]);
  const msg = error && "data" in error ? ((error.data as { detail?: unknown })?.detail ? "Please check names and prices" : "Could not save") : error ? "Could not save" : "";
  return (
    <div>
      <button type="button" className="chip min-h-[40px] gap-2 px-4" aria-expanded={open} onClick={() => setOpen(!open)}><FiSliders aria-hidden />Sizes &amp; toppings</button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 grid gap-6 overflow-hidden md:grid-cols-2"
            onSubmit={(e) => { e.preventDefault(); save({ id, variants: v.filter((r) => r.name.trim()), addons: a.filter((r) => r.name.trim()) }); }}>
            <OptionList title="Sizes (the price replaces the base price)" rows={v} set={setV} />
            <OptionList title="Toppings (the price is added)" rows={a} set={setA} />
            <div className="md:col-span-2"><button className="btn-primary min-h-[44px] px-5" disabled={isLoading}>{isLoading ? "Saving…" : "Save sizes & toppings"}</button>
              {isSuccess && <span role="status" className="ml-3">Saved</span>}{msg && <span role="alert" className="ml-3 text-strawberry">{msg}</span>}</div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------ add a product */
function NewProduct() {
  const dispatch = useAppDispatch();
  const { data: cats = [] } = useAdminCategoriesQuery();
  const [create, { isLoading: creating }] = useAdminCreateProductMutation();
  const [patch] = useAdminPatchProductMutation();
  const [saveOptions] = useAdminSaveOptionsMutation();
  const empty = { name: "", price: "", cat: "", discount: "", description: "", bestseller: false, featured: false, available: true };
  const [f, setF] = useState(empty);
  const [photo, setPhoto] = useState<File | null>(null);
  const [sizes, setSizes] = useState<OptionRow[]>([]); const [tops, setTops] = useState<OptionRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  const catId = Number(f.cat || cats[0]?.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk(""); setBusy(true);
    const warnings: string[] = [];
    try {
      const { id } = await create({ name: f.name.trim(), category_id: catId, base_price: Math.max(0, Math.round(Number(f.price))) }).unwrap();
      const extra: ProductPatch = {};
      if (f.description.trim()) extra.description = f.description.trim();
      const pct = Math.max(0, Math.min(90, Math.round(Number(f.discount) || 0)));
      if (pct > 0) extra.discount_percent = pct;
      if (f.bestseller) extra.is_bestseller = true;
      if (f.featured) extra.is_featured = true;
      if (!f.available) extra.is_available = false;
      if (Object.keys(extra).length) { try { await patch({ id, ...extra }).unwrap(); } catch (x) { warnings.push(`details (${apiError(x)})`); } }
      if (photo) { try { await uploadImage(id, photo); } catch (x) { warnings.push(`photo (${(x as Error).message})`); } }
      const variants = sizes.filter((r) => r.name.trim()); const addons = tops.filter((r) => r.name.trim());
      if (variants.length || addons.length) { try { await saveOptions({ id, variants, addons }).unwrap(); } catch (x) { warnings.push(`sizes & toppings (${apiError(x)})`); } }
      dispatch(api.util.invalidateTags(["AdminProducts", "Menu"]));
      setF(empty); setPhoto(null); setSizes([]); setTops([]);
      if (warnings.length) setErr(`"${f.name.trim()}" was added, but these could not be saved: ${warnings.join("; ")}. Open it in the list below and add them again.`);
      else setOk(`"${f.name.trim()}" was added. Customers see it within about a minute.`);
    } catch (x) {
      setErr(apiError(x) === "Could not reach the server. Please try again." ? "Could not add the product." : apiError(x));
    } finally { setBusy(false); }
  }

  return (
    <form className="card space-y-5 p-5" onSubmit={submit}>
      <h2 className="text-xl">Add a new product</h2>
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[200px] flex-1 text-sm">Product name<input required maxLength={120} className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <Select label="Category" value={f.cat || String(cats[0]?.id ?? "")} onChange={(v) => setF({ ...f, cat: v })} options={cats.map((c) => ({ value: String(c.id), label: c.name }))} />
          </div>
          <label className="block text-sm">Description<textarea rows={3} className={`${input} py-3`} placeholder="What is it made of? Shown on the product card." value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
          <div className="flex flex-wrap items-start gap-3">
            <label className="text-sm">Price (PKR)<input required type="number" min={0} inputMode="numeric" className={`${input} w-32`} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></label>
            <DiscountField value={f.discount} onChange={(v) => setF({ ...f, discount: v })} price={Number(f.price) || 0} />
          </div>
        </div>
        <div className="space-y-3">
          <PhotoPicker file={photo} onFile={(file) => { setPhoto(file); setErr(""); }} />
          <p className="max-w-[220px] text-xs">JPG, PNG or WebP. It is converted to WebP and resized automatically.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-sm"><input className="h-5 w-5 accent-forest" type="checkbox" checked={f.available} onChange={(e) => setF({ ...f, available: e.target.checked })} />Available</label>
        <label className="flex items-center gap-2 text-sm"><input className="h-5 w-5 accent-forest" type="checkbox" checked={f.bestseller} onChange={(e) => setF({ ...f, bestseller: e.target.checked })} />Bestseller</label>
        <label className="flex items-center gap-2 text-sm"><input className="h-5 w-5 accent-forest" type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} />Featured on home page</label>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <OptionList title="Sizes (the price replaces the base price)" rows={sizes} set={setSizes} />
        <OptionList title="Toppings (the price is added)" rows={tops} set={setTops} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary min-h-[44px] gap-2 px-5" disabled={busy || creating || !cats.length}><FiPlus aria-hidden />{busy ? "Adding…" : "Add product"}</button>
        {ok && <span role="status" className="text-sm font-semibold text-forest">{ok}</span>}
      </div>
      {err && <p role="alert" className="text-sm text-strawberry">{err}</p>}
    </form>
  );
}

/* ------------------------------------------------------ one existing product */
function ProductRow({ p, menuDesc, menuLoaded }: { p: AdminProduct; menuDesc: string | undefined; menuLoaded: boolean }) {
  const dispatch = useAppDispatch();
  const [patch, { isLoading }] = useAdminPatchProductMutation();
  const [del] = useAdminDeleteProductMutation();
  const [name, setName] = useState(p.name);
  const [price, setPrice] = useState(String(p.base_price));
  const [discount, setDiscount] = useState(String(p.discount_percent || 0));
  const [desc, setDesc] = useState(menuDesc ?? "");
  const [savedDesc, setSavedDesc] = useState(menuDesc ?? "");
  const touched = useRef(false); // once this row saved or edited the description, the (possibly cached) menu must not overwrite it
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => { setName(p.name); setPrice(String(p.base_price)); setDiscount(String(p.discount_percent || 0)); }, [p.name, p.base_price, p.discount_percent]);
  useEffect(() => { if (!touched.current && menuDesc !== undefined) { setDesc(menuDesc); setSavedDesc(menuDesc); } }, [menuDesc]);

  const pct = Math.max(0, Math.min(90, Math.round(Number(discount) || 0)));
  const priceNum = Math.max(0, Math.round(Number(price) || 0));
  const dirty = name.trim() !== p.name || priceNum !== p.base_price || pct !== (p.discount_percent || 0) || (menuLoaded && desc.trim() !== savedDesc.trim());

  async function save() {
    if (!name.trim()) { setMsg({ ok: false, text: "Name cannot be empty." }); return; }
    const body: ProductPatch = {};
    if (name.trim() !== p.name) body.name = name.trim();
    if (priceNum !== p.base_price) body.base_price = priceNum;
    if (pct !== (p.discount_percent || 0)) body.discount_percent = pct;
    if (menuLoaded && desc.trim() !== savedDesc.trim()) body.description = desc.trim();
    try {
      await patch({ id: p.id, ...body }).unwrap();
      if (body.description !== undefined) { touched.current = true; setSavedDesc(desc.trim()); }
      setMsg({ ok: true, text: "Saved" });
    } catch (e) { setMsg({ ok: false, text: apiError(e) }); }
  }
  async function newPhoto(file: File | null) {
    if (!file) return;
    setMsg(null); setPhotoBusy(true);
    try { await uploadImage(p.id, file); dispatch(api.util.invalidateTags(["AdminProducts", "Menu"])); setMsg({ ok: true, text: "Photo updated" }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setPhotoBusy(false); }
  }

  return (
    <div className="card space-y-4 p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="space-y-2">
          <PhotoPicker file={null} current={p.image_url} onFile={newPhoto} />
          {photoBusy && <p role="status" className="text-xs">Uploading…</p>}
        </div>
        <div className="min-w-[220px] flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="min-w-[180px] flex-1 text-sm">Name<input className={input} value={name} maxLength={120} onChange={(e) => { setName(e.target.value); setMsg(null); }} /></label>
            <span className="chip">{p.category}{p.is_demo ? " · DEMO" : ""}</span>
          </div>
          <label className="block text-sm">Description<textarea rows={2} disabled={!menuLoaded} className={`${input} py-3`} placeholder={menuLoaded ? "Shown on the product card" : "Loading…"} value={desc} onChange={(e) => { touched.current = true; setDesc(e.target.value); setMsg(null); }} /></label>
          <div className="flex flex-wrap items-start gap-3">
            <label className="text-sm">Price (PKR)<input className={`${input} w-32`} type="number" min={0} inputMode="numeric" value={price} onChange={(e) => { setPrice(e.target.value); setMsg(null); }} /></label>
            <DiscountField value={discount} onChange={(v) => { setDiscount(v); setMsg(null); }} price={priceNum} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-sm"><input className="h-5 w-5 accent-forest" type="checkbox" checked={p.is_available} onChange={(e) => patch({ id: p.id, is_available: e.target.checked })} />Available</label>
        <label className="flex items-center gap-2 text-sm"><input className="h-5 w-5 accent-forest" type="checkbox" checked={p.is_bestseller} onChange={(e) => patch({ id: p.id, is_bestseller: e.target.checked })} />Bestseller</label>
        <label className="flex items-center gap-2 text-sm"><input className="h-5 w-5 accent-forest" type="checkbox" checked={p.is_featured} onChange={(e) => patch({ id: p.id, is_featured: e.target.checked })} />Featured</label>
        <div className="ml-auto flex items-center gap-2">
          {msg && <span role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "" : "text-strawberry"}`}>{msg.text}</span>}
          <button type="button" className="btn-primary min-h-[44px] gap-2 px-4 disabled:opacity-50" disabled={!dirty || isLoading} onClick={save}><FiSave aria-hidden />{isLoading ? "Saving…" : "Save changes"}</button>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-strawberry hover:bg-strawberry/10" aria-label={`Delete ${p.name}`}
            onClick={async () => { if (await confirmToast(`Delete ${p.name}? Past orders keep their details.`, { confirmLabel: "Delete", cancelLabel: "Keep it", danger: true })) del(p.id); }}><FiTrash2 /></button>
        </div>
      </div>
      <OptionsEditor id={p.id} />
    </div>
  );
}

/* ------------------------------------------------------------------ tab */
export function ProductsAdmin() {
  const { data = [] } = useAdminProductsQuery();
  const { data: menu } = useGetMenuQuery();
  // The admin list does not carry descriptions, so they come from the public menu (matched by id).
  const descById = useMemo(() => {
    const m = new Map<number, string>();
    menu?.categories.forEach((c) => c.products.forEach((p) => m.set(p.id, p.description ?? "")));
    return m;
  }, [menu]);
  return (
    <div className="space-y-4">
      <NewProduct />
      <p className="text-sm">Edit name, description, price and discount, then press <strong>Save changes</strong>. Availability, bestseller and featured save immediately. Changes reach customers within about a minute. Demo items are marked until you replace them.</p>
      {data.map((p) => <ProductRow key={p.id} p={p} menuLoaded={!!menu} menuDesc={descById.get(p.id)} />)}
    </div>
  );
}