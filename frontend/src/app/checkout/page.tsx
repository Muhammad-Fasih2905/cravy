"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiDollarSign as Banknote, FiBriefcase as Building2, FiSmartphone as Smartphone, FiLoader as Loader2 } from "react-icons/fi";
import { formatPKR } from "@/lib/money";
import type { OrderInput } from "@/lib/types";
import { useCreateOrderMutation, useGetQuoteMutation, useGetSettingsQuery, useGetZonesQuery } from "@/store/api";
import { Select } from "@/components/Select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clear } from "@/store/cartSlice";

type Method = OrderInput["payment_method"];
const field = "min-h-[48px] w-full rounded-2xl border-2 border-vanilla-deep bg-white px-4 focus-visible:border-forest";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const { data: settings } = useGetSettingsQuery();
  const [getQuote, { data: quote }] = useGetQuoteMutation();
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [f, setF] = useState({ name: "", phone: "", email: "", city: "", address: "", landmark: "", notes: "" });
  const [method, setMethod] = useState<Method>("COD");
  const { data: zones = [] } = useGetZonesQuery();
  const [zoneId, setZoneId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const keyRef = useRef<string>();

  const methods = [
    { id: "COD" as Method, label: "Cash on Delivery", hint: "Pay when your order arrives", icon: Banknote, on: settings?.cod_enabled ?? true },
    { id: "EASYPAISA" as Method, label: "Easypaisa", hint: "Manual transfer, verified by us", icon: Smartphone, on: !!settings?.easypaisa_enabled },
    { id: "BANK_TRANSFER" as Method, label: "Bank Transfer", hint: "Manual transfer, verified by us", icon: Building2, on: !!settings?.bank_enabled },
  ].filter((m) => m.on);

  useEffect(() => { if (methods.length && !methods.some((m) => m.id === method)) setMethod(methods[0].id); }, [methods, method]);
  useEffect(() => {
    if (!items.length) return;
    getQuote({ items: items.map(({ product_id, variant_id, addon_ids, quantity }) => ({ product_id, variant_id, addon_ids, quantity })), zone_id: zoneId ? Number(zoneId) : null });
  }, [items, zoneId, getQuote]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  function validate() {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Please enter your full name";
    if (!/^[0-9+\-\s]{10,20}$/.test(f.phone)) e.phone = "Enter a valid phone number, e.g. 0300 1234567";
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email or leave it empty";
    if (zones.length && !zoneId) e.zone = "Please choose your delivery area";
    if (f.city.trim().length < 2) e.city = "Please enter your city";
    if (f.address.trim().length < 5) e.address = "Please enter your full delivery address";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError("");
    if (!validate()) return;
    keyRef.current ??= crypto.randomUUID(); // same key on retries, so a double click never creates two orders
    try {
      const res = await createOrder({
        idempotencyKey: keyRef.current,
        body: {
          items: items.map(({ product_id, variant_id, addon_ids, quantity }) => ({ product_id, variant_id, addon_ids, quantity })),
          zone_id: zoneId ? Number(zoneId) : null, customer_name: f.name.trim(), customer_phone: f.phone.trim(), customer_email: f.email.trim() || null,
          city: f.city.trim(), address: f.address.trim(), landmark: f.landmark.trim() || null,
          instructions: f.notes.trim() || null, payment_method: method,
        },
      }).unwrap();
      sessionStorage.setItem(`cravy-phone-${res.order_number}`, f.phone.trim());
      dispatch(clear());
      router.push(`/order/${res.order_number}`);
    } catch (err) {
      const d = (err as { data?: { detail?: unknown } })?.data?.detail;
      setFormError(typeof d === "string" ? d : "We could not place your order. Please check your connection and try again.");
    }
  }

  if (!items.length)
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="text-3xl">Your cart is empty</h1>
        <Link href="/menu" className="btn-primary mt-6">Browse the menu</Link>
      </main>
    );

  const Err = ({ k }: { k: string }) => (errors[k] ? <p id={`${k}-err`} role="alert" className="mt-1 text-sm text-strawberry">{errors[k]}</p> : null);

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submit} noValidate className="space-y-8">
        <h1 className="text-4xl">Checkout</h1>
        <section className="card space-y-4 p-6" aria-labelledby="d">
          <h2 id="d" className="text-xl">Delivery details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">Full name<input className={field} value={f.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} aria-describedby="name-err" /><Err k="name" /></label>
            <label className="block">Phone<input className={field} value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby="phone-err" /><Err k="phone" /></label>
            <label className="block">Email (optional)<input className={field} value={f.email} onChange={set("email")} type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby="email-err" /><Err k="email" /></label>
            <label className="block">City<input className={field} value={f.city} onChange={set("city")} autoComplete="address-level2" aria-invalid={!!errors.city} aria-describedby="city-err" /><Err k="city" /></label>
          </div>
          {zones.length > 0 && (
            <div><p className="mb-1">Delivery area</p>
              <Select label="Choose your area" value={zoneId} onChange={setZoneId} options={zones.map((z) => ({ value: String(z.id), label: `${z.name}, ${z.city} · ${z.charge === 0 ? "Free" : formatPKR(z.charge)}${z.free_above ? ` (free above ${formatPKR(z.free_above)})` : ""}` }))} />
              <Err k="zone" />
            </div>
          )}
          <label className="block">Delivery address<input className={field} value={f.address} onChange={set("address")} autoComplete="street-address" aria-invalid={!!errors.address} aria-describedby="address-err" /><Err k="address" /></label>
          <label className="block">Nearby landmark (optional)<input className={field} value={f.landmark} onChange={set("landmark")} /></label>
          <label className="block">Delivery instructions (optional)<textarea className={`${field} py-3`} rows={2} value={f.notes} onChange={set("notes")} /></label>
        </section>

        <fieldset className="card p-6">
          <legend className="px-1 font-display text-xl font-extrabold text-forest">Payment method</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {methods.map(({ id, label, hint, icon: Icon }) => (
              <label key={id} className={`flex cursor-pointer flex-col gap-1 rounded-2xl border-2 p-4 transition ${method === id ? "border-forest bg-forest-100" : "border-vanilla-deep bg-white"}`}>
                <input type="radio" name="pay" className="sr-only" checked={method === id} onChange={() => setMethod(id)} />
                <Icon aria-hidden className="text-forest" /><span className="font-bold">{label}</span><span className="text-sm">{hint}</span>
              </label>
            ))}
          </div>
          {method !== "COD" && <p className="mt-3 text-sm">Transfer details and your exact amount are shown after you place the order. We never ask for PINs or passwords.</p>}
        </fieldset>

        {formError && <p role="alert" className="rounded-2xl bg-strawberry/10 p-4 text-strawberry">{formError}</p>}
        <button className="btn-primary w-full text-lg lg:hidden" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" aria-label="Placing order" /> : `Place order${quote ? ` · ${formatPKR(quote.total)}` : ""}`}</button>
      </form>

      <aside className="card h-fit space-y-3 p-6 lg:sticky lg:top-28" aria-label="Order summary">
        <h2 className="text-xl">Order summary</h2>
        <ul className="space-y-2 text-sm">
          {(quote?.lines ?? []).map((l, i) => (
            <li key={i} className="flex justify-between gap-3"><span>{l.quantity}× {l.product_name}{l.variant_name ? ` (${l.variant_name})` : ""}</span><span>{formatPKR(l.line_total)}</span></li>
          ))}
        </ul>
        {quote && (
          <dl className="space-y-1 border-t border-vanilla-deep pt-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPKR(quote.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery{quote.zone_name ? ` (${quote.zone_name})` : ""}</dt><dd>{quote.delivery_pending ? "Choose your area" : quote.delivery_charge === 0 ? "Free" : formatPKR(quote.delivery_charge)}</dd></div>
            {quote.tax_total > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{formatPKR(quote.tax_total)}</dd></div>}
            <div className="flex justify-between text-lg font-bold text-forest"><dt>Total</dt><dd>{formatPKR(quote.total)}</dd></div>
          </dl>
        )}
        {quote && !quote.meets_minimum && <p role="alert" className="text-sm text-strawberry">Minimum order is {formatPKR(quote.min_order_value)}.</p>}
        <button type="button" onClick={(e) => submit(e as unknown as React.FormEvent)} disabled={isLoading} className="btn-primary hidden w-full lg:inline-flex">
          {isLoading ? <Loader2 className="animate-spin" aria-label="Placing order" /> : "Place order"}
        </button>
      </aside>
    </main>
  );
}
