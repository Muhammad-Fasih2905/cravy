"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiBox, FiCheckCircle, FiFileText, FiGrid, FiImage, FiList, FiMapPin, FiNavigation, FiPlus, FiPrinter, FiSettings, FiSliders, FiTrash2, FiX } from "react-icons/fi";
import { formatPKR } from "@/lib/money";
import {
  useAdminLoginMutation, useAdminOrdersQuery, useAdminPatchProductMutation, useAdminProductsQuery,
  useAdminSaveSettingsMutation, useAdminSetPaymentMutation, useAdminSetStatusMutation, useAdminSettingsQuery,
  useAdminStatsQuery, useAdminCategoriesQuery, useAdminOptionsQuery, useAdminSaveOptionsMutation, type OptionRow,
  useAdminCreateProductMutation, useAdminDeleteProductMutation, type AdminOrder,
} from "@/store/api";
import { api } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { Select } from "../Select";
import { AdminHeader } from "./AdminHeader";
import { AdminLogo } from "../brand/AdminLogo";
import { DeliveryRates } from "../DeliveryRates";
import { PUBLIC_API } from "@/lib/config";
import { confirmToast } from "@/lib/notify";
import { openReceipt, printSlip } from "@/lib/adminFetch";
import { useOrderStream, type StreamState } from "@/lib/useOrderStream";

const PAY = ["UNPAID", "AWAITING_PAYMENT", "PENDING_VERIFICATION", "PAID", "FAILED", "REFUNDED"];
const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const METHOD: Record<string, string> = { COD: "Cash on Delivery", EASYPAISA: "Easypaisa" };
const opts = (a: string[], all?: string) => [...(all ? [{ value: "", label: all }] : []), ...a.map((v) => ({ value: v, label: label(v) }))];
const API = PUBLIC_API;
const authHeader = () => ({ authorization: `Bearer ${sessionStorage.getItem("cravy-admin")}` });
const input = "min-h-[44px] w-full rounded-2xl border-2 border-vanilla-deep bg-white px-4";
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");
/** The message the server sent back (for example "This order is already completed"), or a generic one. */
const apiError = (e: unknown) => {
  const d = (e as { data?: { detail?: unknown } })?.data?.detail;
  return typeof d === "string" ? d : "Could not reach the server. Please try again.";
};

type Tab = "overview" | "orders" | "products" | "delivery" | "settings";
type OrderTab = "PENDING" | "COMPLETED" | "CANCELLED" | "ALL";

/** A short chime for a new order (browsers allow it because the admin has already interacted with the page). */
function chime() {
  try {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new C(), o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.type = "sine"; o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start(); o.stop(ctx.currentTime + 0.6); setTimeout(() => ctx.close(), 900);
  } catch { /* sound is a nice-to-have */ }
}

export function AdminApp() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => setToken(sessionStorage.getItem("cravy-admin")), []);
  if (token === undefined) return null;
  if (!token) return <Login onDone={(t) => { sessionStorage.setItem("cravy-admin", t); setToken(t); }} />;
  return <Dashboard onLogout={() => { sessionStorage.removeItem("cravy-admin"); setToken(null); }} />;
}

function LivePill({ state }: { state: StreamState }) {
  const cfg = { live: ["bg-mint/50 text-forest", "bg-forest", "Live"], connecting: ["bg-vanilla text-forest", "bg-mango", "Connecting…"], offline: ["bg-mango/30 text-forest", "bg-strawberry", "Reconnecting…"] }[state];
  return <span role="status" className={`inline-flex items-center gap-2 rounded-pill px-3 py-1 text-xs font-bold ${cfg[0]}`}><span aria-hidden className={`h-2 w-2 rounded-full ${cfg[1]} ${state === "live" ? "animate-pulse" : ""}`} />{cfg[2]}</span>;
}

/** Everything that needs a logged-in admin. It owns the live order stream, so orders stay current on every tab. */
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [orderTab, setOrderTab] = useState<OrderTab>("PENDING");
  const [alerts, setAlerts] = useState<AdminOrder[]>([]);
  const onNew = useCallback((o: AdminOrder) => { setAlerts((a) => [o, ...a].slice(0, 3)); chime(); }, []);
  const stream = useOrderStream(onNew);
  // Always re-read on entering the dashboard; poll as a safety net whenever the live connection is down.
  const { error } = useAdminOrdersQuery(undefined, { refetchOnMountOrArgChange: true, pollingInterval: stream === "live" ? 0 : 10000 });
  const { data: stats } = useAdminStatsQuery();
  useEffect(() => { if (error && "status" in error && error.status === 401) onLogout(); }, [error, onLogout]); // login expired
  useEffect(() => { if (alerts.length) { const t = setTimeout(() => setAlerts((a) => a.slice(0, -1)), 12000); return () => clearTimeout(t); } }, [alerts]);
  useEffect(() => {
    const n = stats?.pending_orders ?? 0;
    document.title = n > 0 ? `(${n}) Pending orders | Cravy Admin` : "Admin | Cravy";
  }, [stats?.pending_orders]);

  const tabs: [Tab, string, React.ElementType][] = [["overview", "Overview", FiGrid], ["orders", "Orders", FiList], ["products", "Products", FiBox], ["delivery", "Delivery", FiMapPin], ["settings", "Settings", FiSettings]];
  const openPending = () => { setOrderTab("PENDING"); setTab("orders"); setAlerts([]); };
  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader tab={tab} onTab={(id) => setTab(id as Tab)} tabs={tabs.map(([id, name, icon]) => ({ id, name, icon }))} onLogout={onLogout} />
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-50 mx-auto flex max-w-md flex-col gap-2 px-3 print:hidden">
        {alerts.map((o) => (
          <div key={o.order_number} className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-forest p-4 text-cream shadow-lift">
            <FiCheckCircle aria-hidden className="shrink-0 text-mango" size={22} />
            <div className="min-w-0 flex-1 text-sm"><p className="font-bold">New order · {formatPKR(o.total)}</p><p className="truncate">{o.order_number} · {o.customer_name}</p></div>
            <button className="rounded-pill bg-mango px-3 py-2 text-sm font-bold text-forest" onClick={openPending}>View</button>
            <button aria-label="Dismiss" className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream/10" onClick={() => setAlerts((a) => a.filter((x) => x.order_number !== o.order_number))}><FiX /></button>
          </div>
        ))}
      </div>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-4 flex justify-end print:hidden"><LivePill state={stream} /></div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {tab === "overview" && <Overview />}{tab === "orders" && <Orders filter={orderTab} setFilter={setOrderTab} />}{tab === "products" && <Products />}{tab === "delivery" && <DeliveryTab />}{tab === "settings" && <SettingsForm />}
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
      <form className="card w-full max-w-sm space-y-4 p-8" onSubmit={async (e) => { e.preventDefault(); try { onDone((await login({ email, password }).unwrap()).token); } catch { } }}>
        <AdminLogo priority className="h-12" /><h1 className="text-2xl">Admin login</h1>
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
  const cards = [["Pending orders", s.pending_orders], ["To collect (pending)", formatPKR(s.pending_amount)], ["Completed", s.completed_orders], ["Total sales (received)", formatPKR(s.total_sales)], ["Today's orders", s.today_orders], ["Total orders", s.total_orders], ["Cancelled", s.cancelled_orders], ["Payments to verify", s.pending_payments]];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([n, v], i) => (
          <motion.div key={n} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
            <p className="text-sm">{n}</p><p className="font-display text-2xl font-extrabold text-forest sm:text-3xl">{v}</p>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5" aria-label="Sales received, last 7 days"><h2 className="mb-4 text-lg">Sales received, last 7 days</h2>
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

function Orders({ filter, setFilter }: { filter: OrderTab; setFilter: (f: OrderTab) => void }) {
  const [method, setMethod] = useState(""); const [q, setQ] = useState("");
  const { data: all = [], isLoading, isError } = useAdminOrdersQuery();
  const counts = useMemo(() => ({
    PENDING: all.filter((o) => o.status === "PENDING").length, COMPLETED: all.filter((o) => o.status === "COMPLETED").length,
    CANCELLED: all.filter((o) => o.status === "CANCELLED").length, ALL: all.length,
  }), [all]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter((o) => (filter === "ALL" || o.status === filter) && (!method || o.payment_method === method)
      && (!s || o.order_number.toLowerCase().includes(s) || o.customer_phone.toLowerCase().includes(s) || o.customer_name.toLowerCase().includes(s)));
  }, [all, filter, method, q]);
  const tabs: [OrderTab, string][] = [["PENDING", "Pending"], ["COMPLETED", "Completed"], ["CANCELLED", "Cancelled"], ["ALL", "All"]];
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Order status" className="flex flex-wrap gap-2 print:hidden">
        {tabs.map(([id, name]) => (
          <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-pill px-5 font-bold transition-colors ${filter === id ? "bg-forest text-cream" : "bg-white text-forest ring-1 ring-vanilla-deep hover:bg-vanilla"}`}>
            {name}<span className={`rounded-pill px-2 text-sm ${filter === id ? "bg-cream/20" : id === "PENDING" && counts.PENDING > 0 ? "bg-mango text-forest" : "bg-vanilla"}`}>{counts[id]}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row print:hidden">
        <input className={`${input} sm:max-w-xs`} placeholder="Search number, name, phone" aria-label="Search orders" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select label="Payment" value={method} onChange={setMethod} options={[{ value: "", label: "All payment methods" }, { value: "COD", label: "Cash on Delivery" }, { value: "EASYPAISA", label: "Easypaisa" }]} />
      </div>
      {isError && <p role="alert" className="rounded-2xl bg-strawberry/10 p-4 text-strawberry">Could not load orders. Your session may have expired, please log in again.</p>}
      {isLoading && <div className="h-32 animate-pulse rounded-card bg-vanilla" />}
      {!isLoading && !isError && list.length === 0 && <p className="card p-6">{filter === "PENDING" ? "No pending orders. New orders appear here by themselves." : "No orders found."}</p>}
      {list.map((o) => <OrderCard key={o.order_number} o={o} />)}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = { PENDING: "bg-mango/40", COMPLETED: "bg-mint/60", CANCELLED: "bg-strawberry/15 text-strawberry" };

function OrderCard({ o }: { o: AdminOrder }) {
  const [setStatus, { isLoading: changing }] = useAdminSetStatusMutation();
  const [setPayment, { isLoading: payBusy }] = useAdminSetPaymentMutation();
  const [note, setNote] = useState(o.admin_note ?? "");
  const [err, setErr] = useState("");
  const cod = o.payment_method === "COD";
  const pending = o.status === "PENDING";
  const canComplete = pending && (cod || o.payment_status === "PAID");

  async function move(status: "COMPLETED" | "CANCELLED") {
    const msg = status === "COMPLETED"
      ? `Mark ${o.order_number} as completed?\n\nThis confirms ${formatPKR(o.total)} has been received.`
      : `Cancel ${o.order_number}? This cannot be undone.`;
    const sure = await confirmToast(msg, status === "COMPLETED"
      ? { confirmLabel: "Yes, completed", cancelLabel: "Not yet" }
      : { confirmLabel: "Yes, cancel order", cancelLabel: "Keep order", danger: true });
    if (!sure) return;
    setErr("");
    try { await setStatus({ n: o.order_number, status }).unwrap(); } catch (e) { setErr(apiError(e)); }
  }
  async function pay(status: string) {
    setErr("");
    try { await setPayment({ n: o.order_number, status, note }).unwrap(); } catch (e) { setErr(apiError(e)); }
  }

  return (
    <details className="card p-5" open={pending}>
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 font-bold">
        <span className="font-mono">{o.order_number}</span><span>{o.customer_name}</span><span>{formatPKR(o.total)}</span>
        <span className={`chip ${STATUS_STYLE[o.status] ?? ""}`}>{label(o.status)}</span>
        <span className="chip bg-mango/30">{METHOD[o.payment_method] ?? o.payment_method} · {cod && pending ? "Collect cash" : cod && o.payment_status === "PAID" ? "Paid in cash" : label(o.payment_status)}</span>
        <span className="w-full text-xs font-normal text-ink/70">Placed {when(o.created_at)}{o.completed_at ? ` · Completed ${when(o.completed_at)}` : ""}</span>
      </summary>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div className="space-y-1 text-sm">
          <p><strong>{o.customer_name}</strong> · <a className="underline" href={`tel:${o.customer_phone}`}>{o.customer_phone}</a>{o.customer_email ? ` · ${o.customer_email}` : ""}</p>
          <p>{o.address}, {o.city}{o.landmark ? ` (near ${o.landmark})` : ""}</p>
          <p className="flex flex-wrap items-center gap-2">
            {o.distance_km != null && <span>{o.distance_km.toFixed(1)} km from shop{o.delivery_zone ? ` (${o.delivery_zone})` : ""}</span>}
            {o.map_url && <a className="inline-flex items-center gap-1 font-bold text-forest underline" href={o.map_url} target="_blank" rel="noopener noreferrer"><FiNavigation aria-hidden />Open in Maps</a>}
          </p>
          {o.instructions && <p>Note: {o.instructions}</p>}
          <ul className="mt-2 list-disc pl-5">{o.items.map((i, n) => <li key={n}>{i.quantity}× {i.name}{i.variant ? ` (${i.variant})` : ""}{i.addons.length ? ` + ${i.addons.map((a) => a.name).join(", ")}` : ""} — {formatPKR(i.line_total)}</li>)}</ul>
          <p>Subtotal {formatPKR(o.subtotal)} · Delivery {o.delivery_charge === 0 ? "FREE" : formatPKR(o.delivery_charge)}{o.tax_total ? ` · Tax ${formatPKR(o.tax_total)}` : ""}{o.discount_total ? ` · Discount −${formatPKR(o.discount_total)}` : ""} · <strong>Total {formatPKR(o.total)}</strong></p>
          {o.transaction_ref && <p>Transaction ref: <strong className="font-mono">{o.transaction_ref}</strong></p>}
          {o.has_receipt && (
            <button className="btn-secondary min-h-[40px] gap-2 px-4" onClick={() => openReceipt(o.order_number)}><FiFileText aria-hidden />View receipt</button>
          )}
        </div>
        <div className="space-y-3">
          {pending && cod && <p className="rounded-2xl bg-mango/25 p-3 text-sm"><strong>Collect {formatPKR(o.total)} in cash.</strong> Once the payment has come in, mark the order as completed.</p>}
          {!cod && pending && o.payment_status !== "PAID" && (
            <div className="space-y-2 rounded-2xl bg-mango/25 p-3 text-sm">
              <p><strong>Easypaisa payment: {label(o.payment_status)}.</strong> Check the amount and transaction ID in your Easypaisa account, then confirm it. The order can be completed after that.</p>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary min-h-[40px] px-4" disabled={payBusy} onClick={() => pay("PAID")}>Payment received</button>
                <button className="btn-secondary min-h-[40px] px-4" disabled={payBusy || o.payment_status === "FAILED"} onClick={() => pay("FAILED")}>Could not verify</button>
              </div>
            </div>
          )}
          {pending && (
            <input className={input} placeholder="Note (optional)" aria-label="Payment note" value={note} onChange={(e) => setNote(e.target.value)}
              onBlur={() => note !== (o.admin_note ?? "") && pay(o.payment_status)} />
          )}
          {!pending && o.admin_note && <p className="text-sm">Note: {o.admin_note}</p>}
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary min-h-[44px] gap-2 px-4" onClick={() => printSlip(o.order_number)}><FiPrinter aria-hidden />Print slip</button>
            {pending && <button className="btn-primary min-h-[44px] gap-2 px-4 disabled:opacity-50" disabled={!canComplete || changing} onClick={() => move("COMPLETED")}><FiCheckCircle aria-hidden />{changing ? "Saving…" : "Mark completed"}</button>}
            {pending && <button className="inline-flex min-h-[44px] items-center rounded-pill px-4 font-bold text-strawberry hover:bg-strawberry/10" disabled={changing} onClick={() => move("CANCELLED")}>Cancel order</button>}
          </div>
          {err && <p role="alert" className="text-sm text-strawberry">{err}</p>}
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
          <button className="grid h-10 w-10 place-items-center rounded-full text-strawberry hover:bg-strawberry/10" aria-label={`Delete ${p.name}`} onClick={async () => { if (await confirmToast(`Delete ${p.name}? Past orders keep their details.`, { confirmLabel: "Delete", cancelLabel: "Keep it", danger: true })) del(p.id); }}><FiTrash2 /></button>
          <div className="w-full"><OptionsEditor id={p.id} /></div>
        </div>
      ))}
    </div>
  );
}

const FIELDS: [string, string, "text" | "number" | "bool"][] = [
  ["business_name", "Business name", "text"], ["phone", "Phone", "text"], ["announcement", "Announcement bar", "text"],
  ["min_order_value", "Minimum order (PKR)", "number"], ["tax_percent", "Tax / GST (%) added to every order", "number"],
  ["cod_enabled", "Cash on Delivery enabled", "bool"],
  ["easypaisa_enabled", "Easypaisa enabled", "bool"], ["easypaisa_name", "Easypaisa account name", "text"], ["easypaisa_number", "Easypaisa number", "text"],
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

function DeliveryTab() {
  const { data } = useAdminSettingsQuery();
  const [save, { isLoading, isSuccess, error }] = useAdminSaveSettingsMutation();
  const [lat, setLat] = useState(""); const [lng, setLng] = useState("");
  useEffect(() => { if (data) { setLat(data.shop_latitude == null ? "" : String(data.shop_latitude)); setLng(data.shop_longitude == null ? "" : String(data.shop_longitude)); } }, [data]);
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const bad = (num(lat) === null) !== (num(lng) === null) || [lat, lng].some((v) => v.trim() !== "" && !Number.isFinite(Number(v)));
  return (
    <div className="space-y-6">
      <section className="card space-y-3 p-5 sm:p-6">
        <h2 className="text-xl">Delivery charges</h2>
        <p className="text-sm">These rates are fixed and apply to every order, wherever it comes from. The charge is worked out on the server from the distance between the shop and the customer&apos;s map pin, so it cannot be changed from the browser.</p>
        <DeliveryRates />
      </section>
      <form className="card space-y-3 p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); if (!bad) save({ shop_latitude: num(lat), shop_longitude: num(lng) }); }}>
        <h2 className="text-xl">Shop location</h2>
        <p className="text-sm">Distances are measured from here. Leave both empty to use the built-in location (Gulshan-e-Iqbal, Karachi). To change it, right-click the shop in Google Maps and copy the two numbers.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">Latitude<input className={input} inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="24.911012" /></label>
          <label className="block text-sm">Longitude<input className={input} inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="67.105612" /></label>
        </div>
        {bad && <p role="alert" className="text-sm text-strawberry">Enter both numbers, or leave both empty.</p>}
        <div><button className="btn-primary min-h-[44px] px-5" disabled={isLoading || bad}>{isLoading ? "Saving…" : "Save shop location"}</button>
          {isSuccess && <span role="status" className="ml-3">Saved</span>}{error && <span role="alert" className="ml-3 text-strawberry">{apiError(error)}</span>}</div>
      </form>
    </div>
  );
}