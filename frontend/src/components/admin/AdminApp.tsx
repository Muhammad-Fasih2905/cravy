"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiBox, FiFileText, FiMapPin, FiSliders, FiGrid, FiImage, FiList, FiLogOut, FiPlus, FiPrinter, FiSettings, FiTrash2 } from "react-icons/fi";
import { formatPKR } from "@/lib/money";
import {
  useAdminLoginMutation, useAdminOrdersQuery, useAdminPatchProductMutation, useAdminProductsQuery,
  useAdminSaveSettingsMutation, useAdminSetPaymentMutation, useAdminSetStatusMutation, useAdminSettingsQuery,
  useAdminStatsQuery, useAdminCategoriesQuery, useAdminZonesQuery, useAdminCreateZoneMutation, useAdminPatchZoneMutation, useAdminDeleteZoneMutation, useAdminOptionsQuery, useAdminSaveOptionsMutation, type OptionRow, useAdminCreateProductMutation, useAdminDeleteProductMutation, type AdminOrder,
} from "@/store/api";
import { api } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { Select } from "../Select";
import { AdminHeader } from "./AdminHeader";
import { Logo } from "../brand/Logo";

const STATUSES = ["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
const PAY = ["UNPAID", "PENDING_VERIFICATION", "PAID", "FAILED", "REFUNDED"];
const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const opts = (a: string[], all?: string) => [...(all ? [{ value: "", label: all }] : []), ...a.map((v) => ({ value: v, label: label(v) }))];
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const authHeader = () => ({ authorization: `Bearer ${sessionStorage.getItem("cravy-admin")}` });
const input = "min-h-[44px] w-full rounded-2xl border-2 border-vanilla-deep bg-white px-4";

type Tab = "overview" | "orders" | "products" | "delivery" | "settings";

export function AdminApp() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("overview");
  useEffect(() => setToken(sessionStorage.getItem("cravy-admin")), []);
  if (token === undefined) return null;
  if (!token) return <Login onDone={(t) => { sessionStorage.setItem("cravy-admin", t); setToken(t); }} />;

  const tabs: [Tab, string, React.ElementType][] = [["overview", "Overview", FiGrid], ["orders", "Orders", FiList], ["products", "Products", FiBox], ["delivery", "Delivery", FiMapPin], ["settings", "Settings", FiSettings]];
  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader tab={tab} onTab={(id) => setTab(id as Tab)} tabs={tabs.map(([id, name, icon]) => ({ id, name, icon }))}
        onLogout={() => { sessionStorage.removeItem("cravy-admin"); setToken(null); }} />
      <main className="mx-auto max-w-6xl px-5 py-8">
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {tab === "overview" && <Overview />}{tab === "orders" && <Orders />}{tab === "products" && <Products />}{tab === "delivery" && <Zones />}{tab === "settings" && <SettingsForm />}
        </motion.div>
      </AnimatePresence>
    </main>
    </div>
  );
}

function Login({ onDone }: { onDone: (t: string) => void }) {
  const [login, { isLoading, error }] = useAdminLoginMutation();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const msg = error && "data" in error ? ((error.data as { detail?: string })?.detail ?? "Login failed") : error ? "Could not reach the server" : "";
  return (
    <main className="grid min-h-screen place-items-center bg-forest px-5" style={{ backgroundImage: "radial-gradient(50% 60% at 100% 0%, rgba(246,184,32,.2), transparent 70%), radial-gradient(45% 55% at 0% 100%, rgba(168,230,207,.14), transparent 70%)" }}>
      <form className="card w-full max-w-sm space-y-4 p-8" onSubmit={async (e) => { e.preventDefault(); try { onDone((await login({ email, password }).unwrap()).token); } catch {} }}>
        <Logo className="h-12" /><h1 className="text-2xl">Admin login</h1>
        <label className="block">Email<input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
        <label className="block">Password<input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        {msg && <p role="alert" className="text-sm text-strawberry">{msg}</p>}
        <button className="btn-primary w-full" disabled={isLoading}>{isLoading ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}

function Overview() {
  const { data: s, isError } = useAdminStatsQuery();
  if (isError) return <p role="alert">Could not load stats. Your session may have expired, please log in again.</p>;
  if (!s) return <div className="h-40 animate-pulse rounded-card bg-vanilla" />;
  const max = Math.max(1, ...s.daily_sales.map((d) => d.total));
  const cards = [["Total orders", s.total_orders], ["Today's orders", s.today_orders], ["Total sales", formatPKR(s.total_sales)], ["Pending orders", s.pending_orders], ["Completed", s.completed_orders], ["Payments to verify", s.pending_payments]];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map(([n, v], i) => (
          <motion.div key={n} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
            <p className="text-sm">{n}</p><p className="font-display text-3xl font-extrabold text-forest">{v}</p>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5" aria-label="Sales, last 7 days"><h2 className="mb-4 text-lg">Sales, last 7 days</h2>
          <div className="flex h-40 items-end gap-2">
            {s.daily_sales.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${formatPKR(d.total)}`}>
                <motion.div className="w-full rounded-t-lg bg-mango" initial={{ height: 0 }} animate={{ height: `${(d.total / max) * 100}%` }} transition={{ duration: 0.6 }} />
                <span className="text-xs">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card p-5"><h2 className="mb-3 text-lg">Bestselling products</h2>
          {s.bestsellers.length === 0 ? <p>No orders yet.</p> : <ol className="space-y-2">{s.bestsellers.map((b) => <li key={b.name} className="flex justify-between"><span>{b.name}</span><strong>{b.quantity}</strong></li>)}</ol>}
        </section>
      </div>
    </div>
  );
}

function Orders() {
  const [status, setStatus] = useState(""); const [method, setMethod] = useState(""); const [q, setQ] = useState("");
  const { data = [], isFetching, isError } = useAdminOrdersQuery({ status, method, q });
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row print:hidden">
        <input className={`${input} sm:max-w-xs`} placeholder="Search number, name, phone" aria-label="Search orders" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select label="Status" value={status} onChange={setStatus} options={opts(STATUSES, "All statuses")} />
        <Select label="Payment" value={method} onChange={setMethod} options={opts(["COD", "EASYPAISA", "BANK_TRANSFER"], "All methods")} />
      </div>
      {isError && <p role="alert">Could not load orders.</p>}
      {!isFetching && data.length === 0 && <p className="card p-6">No orders found.</p>}
      {data.map((o) => <OrderCard key={o.order_number} o={o} />)}
    </div>
  );
}

function OrderCard({ o }: { o: AdminOrder }) {
  const [setStatus] = useAdminSetStatusMutation(); const [setPayment, { isLoading }] = useAdminSetPaymentMutation();
  const [note, setNote] = useState(o.admin_note ?? "");
  return (
    <details className="card p-5">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 font-bold">
        <span className="font-mono">{o.order_number}</span><span>{o.customer_name}</span><span>{formatPKR(o.total)}</span>
        <span className="chip">{label(o.status)}</span><span className="chip bg-mango/30">{label(o.payment_method)} · {label(o.payment_status)}</span>
      </summary>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div className="space-y-1 text-sm">
          <p><strong>{o.customer_name}</strong> · {o.customer_phone}{o.customer_email ? ` · ${o.customer_email}` : ""}</p>
          <p>{o.address}, {o.city}{o.landmark ? ` (near ${o.landmark})` : ""}</p>
          {o.instructions && <p>Note: {o.instructions}</p>}
          <ul className="mt-2 list-disc pl-5">{o.items.map((i, n) => <li key={n}>{i.quantity}× {i.name}{i.variant ? ` (${i.variant})` : ""}{i.addons.length ? ` + ${i.addons.map((a) => a.name).join(", ")}` : ""} — {formatPKR(i.line_total)}</li>)}</ul>
          <p>Delivery {formatPKR(o.delivery_charge)}{o.delivery_zone ? ` (${o.delivery_zone})` : ""}{o.tax_total ? ` · Tax ${formatPKR(o.tax_total)}` : ""}{o.discount_total ? ` · Discount −${formatPKR(o.discount_total)}` : ""} · <strong>Total {formatPKR(o.total)}</strong></p>
          {o.transaction_ref && <p>Transaction ref: <strong className="font-mono">{o.transaction_ref}</strong></p>}
          {o.has_receipt && (
            <button className="btn-secondary min-h-[40px] gap-2 px-4 print:hidden" onClick={async () => {
              const r = await fetch(`${API}/api/admin/orders/${o.order_number}/receipt`, { headers: authHeader() });
              if (r.ok) window.open(URL.createObjectURL(await r.blob()), "_blank"); else alert("Could not open the receipt");
            }}><FiFileText aria-hidden />View receipt</button>
          )}
        </div>
        <div className="space-y-3 print:hidden">
          <Select label="Order status" value={o.status} onChange={(v) => setStatus({ n: o.order_number, status: v })} options={opts(STATUSES)} />
          <Select label="Payment status" value={o.payment_status} onChange={(v) => setPayment({ n: o.order_number, status: v, note })} options={opts(PAY)} />
          <input className={input} placeholder="Payment note" aria-label="Payment note" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (o.admin_note ?? "") && setPayment({ n: o.order_number, status: o.payment_status, note })} />
          <button className="btn-secondary min-h-[44px] gap-2 px-4" onClick={() => window.print()} disabled={isLoading}><FiPrinter aria-hidden />Print</button>
        </div>
      </div>
    </details>
  );
}

function Products() {
  const dispatch = useAppDispatch();
  const { data = [] } = useAdminProductsQuery(); const [patch] = useAdminPatchProductMutation();
  const { data: cats = [] } = useAdminCategoriesQuery(); const [create, { isLoading: creating }] = useAdminCreateProductMutation();
  const [del] = useAdminDeleteProductMutation();
  const [nf, setNf] = useState({ name: "", price: "", cat: "" });
  const [err, setErr] = useState("");

  async function uploadImage(id: number, file: File) {
    setErr("");
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch(`${API}/api/admin/products/${id}/image`, { method: "POST", headers: authHeader(), body: fd });
    if (!r.ok) setErr((await r.json().catch(() => ({}))).detail ?? "Upload failed");
    dispatch(api.util.invalidateTags(["AdminProducts", "Menu"]));
  }

  return (
    <div className="space-y-4">
      <form className="card flex flex-wrap items-end gap-3 p-4" onSubmit={async (e) => {
        e.preventDefault(); setErr("");
        try { await create({ name: nf.name, category_id: Number(nf.cat || cats[0]?.id), base_price: Number(nf.price) }).unwrap(); setNf({ name: "", price: "", cat: "" }); }
        catch { setErr("Could not add the product"); }
      }}>
        <label className="min-w-[180px] flex-1 text-sm">New product name<input required className={input} value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} /></label>
        <label className="text-sm">Price (PKR)<input required type="number" min={0} className={`${input} w-28`} value={nf.price} onChange={(e) => setNf({ ...nf, price: e.target.value })} /></label>
        <Select label="Category" value={nf.cat || String(cats[0]?.id ?? "")} onChange={(v) => setNf({ ...nf, cat: v })} options={cats.map((c) => ({ value: String(c.id), label: c.name }))} />
        <button className="btn-primary min-h-[44px] gap-2 px-4" disabled={creating}><FiPlus aria-hidden />Add</button>
      </form>
      {err && <p role="alert" className="text-strawberry">{err}</p>}
      <p className="text-sm">Edit prices and availability, upload photos (JPG, PNG or WEBP, up to 3 MB). Demo items are marked until you replace them.</p>
      {data.map((p) => (
        <div key={p.id} className="card flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-[180px] flex-1"><p className="font-bold">{p.name}</p><p className="text-sm">{p.category}{p.is_demo ? " · DEMO" : ""}{p.image_url ? " · has photo" : ""}</p></div>
          <label className="text-sm">Price (PKR)<input key={p.base_price} className={`${input} w-28`} type="number" min={0} defaultValue={p.base_price} onBlur={(e) => Number(e.target.value) !== p.base_price && patch({ id: p.id, base_price: Number(e.target.value) })} /></label>
          <label className="flex items-center gap-2 text-sm"><input className="h-5 w-5 accent-forest" type="checkbox" checked={p.is_available} onChange={(e) => patch({ id: p.id, is_available: e.target.checked })} />Available</label>
          <label className="flex items-center gap-2 text-sm"><input className="h-5 w-5 accent-forest" type="checkbox" checked={p.is_bestseller} onChange={(e) => patch({ id: p.id, is_bestseller: e.target.checked })} />Bestseller</label>
          <label className="flex items-center gap-2 text-sm"><input className="h-5 w-5 accent-forest" type="checkbox" checked={p.is_featured} onChange={(e) => patch({ id: p.id, is_featured: e.target.checked })} />Featured</label>
          <label className="btn-secondary min-h-[40px] cursor-pointer gap-2 px-4 text-sm"><FiImage aria-hidden />Photo
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && uploadImage(p.id, e.target.files[0])} /></label>
          <button className="grid h-10 w-10 place-items-center rounded-full text-strawberry hover:bg-strawberry/10" aria-label={`Delete ${p.name}`} onClick={() => confirm(`Delete ${p.name}? Past orders keep their details.`) && del(p.id)}><FiTrash2 /></button>
          <div className="w-full"><OptionsEditor id={p.id} /></div>
        </div>
      ))}
    </div>
  );
}

const FIELDS: [string, string, "text" | "number" | "bool"][] = [
  ["business_name", "Business name", "text"], ["phone", "Phone", "text"], ["announcement", "Announcement bar", "text"],
  ["delivery_charge", "Delivery charge (PKR)", "number"], ["min_order_value", "Minimum order (PKR)", "number"], ["tax_percent", "Tax / GST (%) added to every order", "number"],
  ["cod_enabled", "Cash on Delivery enabled", "bool"],
  ["easypaisa_enabled", "Easypaisa enabled", "bool"], ["easypaisa_name", "Easypaisa account name", "text"], ["easypaisa_number", "Easypaisa number", "text"],
  ["bank_enabled", "Bank transfer enabled", "bool"], ["bank_name", "Bank name", "text"], ["bank_account_title", "Account title", "text"],
  ["bank_account_number", "Account number", "text"], ["bank_iban", "IBAN", "text"],
];

function SettingsForm() {
  const { data } = useAdminSettingsQuery(); const [save, { isLoading, isSuccess, isError }] = useAdminSaveSettingsMutation();
  const [f, setF] = useState<Record<string, string | number | boolean | null>>({});
  useEffect(() => { if (data) setF(data); }, [data]);
  if (!data) return <div className="h-40 animate-pulse rounded-card bg-vanilla" />;
  return (
    <form className="card grid gap-4 p-6 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(f); }}>
      <p className="text-sm sm:col-span-2">Enter your real payment details here. Customers only see a method after you enable it.</p>
      {FIELDS.map(([k, name, type]) => type === "bool" ? (
        <label key={k} className="flex min-h-[44px] items-center gap-3"><input className="h-5 w-5 accent-forest" type="checkbox" checked={!!f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} />{name}</label>
      ) : (
        <label key={k}>{name}<input className={input} type={type} min={type === "number" ? 0 : undefined} value={(f[k] as string | number | null) ?? ""}
          onChange={(e) => setF({ ...f, [k]: type === "number" ? Number(e.target.value) : e.target.value || null })} /></label>
      ))}
      <div className="sm:col-span-2"><button className="btn-primary" disabled={isLoading}>{isLoading ? "Saving…" : "Save settings"}</button>
        {isSuccess && <span role="status" className="ml-3">Saved</span>}{isError && <span role="alert" className="ml-3 text-strawberry">Could not save</span>}</div>
    </form>
  );
}


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

function Zones() {
  const { data = [] } = useAdminZonesQuery();
  const [create, { isLoading }] = useAdminCreateZoneMutation(); const [patch] = useAdminPatchZoneMutation(); const [del] = useAdminDeleteZoneMutation();
  const [n, setN] = useState({ name: "", city: "", charge: "", free: "", min: "" });
  const orNull = (v: string) => (v.trim() === "" ? null : Number(v));
  return (
    <div className="space-y-4">
      <p className="text-sm">Add delivery areas with their own charge. Once at least one active area exists, customers must choose one at checkout. With no areas, the flat delivery charge from Settings applies.</p>
      <form className="card flex flex-wrap items-end gap-3 p-4" onSubmit={async (e) => {
        e.preventDefault();
        try { await create({ name: n.name, city: n.city, charge: Number(n.charge), free_above: orNull(n.free), min_order: orNull(n.min) }).unwrap(); setN({ name: "", city: "", charge: "", free: "", min: "" }); } catch {}
      }}>
        <label className="min-w-[140px] flex-1 text-sm">Area name<input required className={input} value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} /></label>
        <label className="min-w-[120px] text-sm">City<input required className={input} value={n.city} onChange={(e) => setN({ ...n, city: e.target.value })} /></label>
        <label className="text-sm">Charge<input required type="number" min={0} className={`${input} w-24`} value={n.charge} onChange={(e) => setN({ ...n, charge: e.target.value })} /></label>
        <label className="text-sm">Free above<input type="number" min={0} className={`${input} w-28`} value={n.free} onChange={(e) => setN({ ...n, free: e.target.value })} /></label>
        <label className="text-sm">Min order<input type="number" min={0} className={`${input} w-28`} value={n.min} onChange={(e) => setN({ ...n, min: e.target.value })} /></label>
        <button className="btn-primary min-h-[44px] gap-2 px-4" disabled={isLoading}><FiPlus aria-hidden />Add area</button>
      </form>
      {data.length === 0 && <p className="card p-6">No delivery areas yet. The flat delivery charge is used.</p>}
      {data.map((z) => (
        <div key={`${z.id}-${z.name}-${z.city}-${z.charge}-${z.free_above}-${z.min_order}`} className="card flex flex-wrap items-end gap-3 p-4">
          <label className="min-w-[140px] flex-1 text-sm">Area<input className={input} defaultValue={z.name} onBlur={(e) => e.target.value.trim() && e.target.value !== z.name && patch({ id: z.id, name: e.target.value })} /></label>
          <label className="min-w-[120px] text-sm">City<input className={input} defaultValue={z.city} onBlur={(e) => e.target.value.trim() && e.target.value !== z.city && patch({ id: z.id, city: e.target.value })} /></label>
          <label className="text-sm">Charge<input type="number" min={0} className={`${input} w-24`} defaultValue={z.charge} onBlur={(e) => Number(e.target.value) !== z.charge && patch({ id: z.id, charge: Number(e.target.value) })} /></label>
          <label className="text-sm">Free above<input type="number" min={0} className={`${input} w-28`} defaultValue={z.free_above ?? ""} onBlur={(e) => orNull(e.target.value) !== z.free_above && patch({ id: z.id, free_above: orNull(e.target.value) })} /></label>
          <label className="text-sm">Min order<input type="number" min={0} className={`${input} w-28`} defaultValue={z.min_order ?? ""} onBlur={(e) => orNull(e.target.value) !== z.min_order && patch({ id: z.id, min_order: orNull(e.target.value) })} /></label>
          <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-forest" checked={z.is_active} onChange={(e) => patch({ id: z.id, is_active: e.target.checked })} />Active</label>
          <button aria-label={`Delete ${z.name}`} className="grid h-11 w-11 place-items-center rounded-full text-strawberry hover:bg-strawberry/10" onClick={() => confirm(`Delete ${z.name}?`) && del(z.id)}><FiTrash2 /></button>
        </div>
      ))}
    </div>
  );
}