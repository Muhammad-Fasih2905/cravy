"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiAlertCircle, FiDollarSign as Banknote, FiSmartphone as Smartphone, FiLoader as Loader2, FiLock, FiMapPin, FiTruck } from "react-icons/fi";
import { haversineKm, openLocationModal, saveLocation, useSavedLocation } from "@/lib/location";
import { formatPKR } from "@/lib/money";
import type { LatLng, OrderInput } from "@/lib/types";
import { useCreateOrderMutation, useGetPaymentMethodsQuery, useGetQuoteMutation } from "@/store/api";
import { LocationPicker } from "@/components/LocationPicker";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clear } from "@/store/cartSlice";

type Method = OrderInput["payment_method"];
const field = "min-h-[48px] w-full rounded-2xl border-2 border-vanilla-deep bg-white px-4 focus-visible:border-forest";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const { data: payMethods, isError: payError } = useGetPaymentMethodsQuery();
  const coupon = useAppSelector((s) => s.cart.coupon);
  const [getQuote, { data: quote, error: quoteErr, isLoading: quoting }] = useGetQuoteMutation();
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [f, setF] = useState({ name: "", phone: "", email: "", city: "", address: "", landmark: "", notes: "" });
  const [method, setMethod] = useState<Method>("COD");
  const [loc, setLoc] = useState<LatLng | null>(null); // the customer's map pin; the server turns it into a distance and a charge
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const keyRef = useRef<string>();

  // A location chosen in the popup (navbar) fills this form. If the customer skipped the popup, they enter it here instead.
  const saved = useSavedLocation();
  const appliedStamp = useRef<number | null>(null);
  const addrTouched = useRef(false);
  useEffect(() => {
    if (!saved || appliedStamp.current === saved.stamp) return;
    appliedStamp.current = saved.stamp;
    if (saved.latitude != null && saved.longitude != null) setLoc({ latitude: saved.latitude, longitude: saved.longitude });
    setF((prev) => ({ ...prev, city: saved.city, address: addrTouched.current && prev.address ? prev.address : (saved.address ?? `${saved.area}, ${saved.city}`) }));
  }, [saved]);
  // Already chosen in the popup (not just a pin dropped on this page)? Then "Use my current location" is not needed here.
  const hideLocate = !!saved && saved.source !== "pin" && saved.latitude != null && saved.longitude != null;
  // A location (with coordinates) is already set in the navbar: the whole "Delivery location" map block is not shown here.
  const hasNavLocation = !!saved && saved.latitude != null && saved.longitude != null;

  const ICONS = { COD: Banknote, EASYPAISA: Smartphone } as const;
  const HINTS = { COD: "Pay in cash when your order arrives. Nothing to pay online.", EASYPAISA: "Pay online now from the Easypaisa app" } as const;
  const methods = (payMethods ?? (payError ? [{ method: "COD", label: "Cash on Delivery", enabled: true, description: "" }] : []))
    .filter((m) => m.enabled)
    .map((m) => ({ id: m.method as Method, label: m.label, hint: HINTS[m.method as Method], icon: ICONS[m.method as Method], number: m.account_number }));
  const easypaisa = methods.find((m) => m.id === "EASYPAISA");

  const methodIds = methods.map((m) => m.id).join(",");
  useEffect(() => { if (methods.length && !methods.some((m) => m.id === method)) setMethod(methods[0].id); }, [methodIds, method]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!items.length) return;
    getQuote({
      items: items.map(({ product_id, variant_id, addon_ids, quantity }) => ({ product_id, variant_id, addon_ids, quantity })),
      coupon_code: coupon, latitude: loc?.latitude ?? null, longitude: loc?.longitude ?? null,
    });
  }, [items, loc, coupon, getQuote]);
  const quoteMsg = quoteErr && "data" in quoteErr ? ((quoteErr.data as { detail?: unknown })?.detail as string | undefined) : quoteErr ? "Could not reach the server" : undefined;
  const outOfRange = !!quote && quote.deliverable === false;

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (k === "address") addrTouched.current = true;
    setF({ ...f, [k]: e.target.value });
  };

  // The pin was moved or placed on this page: keep the navbar location in step with it.
  const onPin = (v: LatLng) => {
    setLoc(v);
    setErrors((e) => ({ ...e, location: "" }));
    const near = !!saved && saved.latitude != null && saved.longitude != null && haversineKm({ lat: saved.latitude, lng: saved.longitude }, { lat: v.latitude, lng: v.longitude }) < 0.4;
    const next = saveLocation({
      city: f.city.trim() || saved?.city || "Karachi",
      area: near && saved ? saved.area : "Pinned location",
      address: near && saved ? saved.address : (f.address.trim() || undefined),
      latitude: v.latitude, longitude: v.longitude, source: "pin",
    });
    appliedStamp.current = next.stamp;
  };

  function validate() {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Please enter your full name";
    if (!/^[0-9+\-\s]{10,20}$/.test(f.phone)) e.phone = "Enter a valid phone number, e.g. 0300 1234567";
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email or leave it empty";
    if (!loc) e.location = "Please set your delivery location on the map";
    else if (outOfRange) e.location = quote?.delivery_message ?? "Sorry, that location is outside our delivery range";
    if (f.city.trim().length < 2) e.city = "Please enter your city";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // The delivery address comes from the location chosen in the popup (no separate field on this page).
  const deliveryAddress = () => f.address.trim() || (saved ? (saved.address ?? `${saved.area}, ${saved.city}`) : "") || `Pinned location, ${f.city.trim()}`;

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
          latitude: loc!.latitude, longitude: loc!.longitude, coupon_code: coupon, customer_name: f.name.trim(), customer_phone: f.phone.trim(), customer_email: f.email.trim() || null,
          city: f.city.trim(), address: deliveryAddress(), landmark: f.landmark.trim() || null,
          instructions: f.notes.trim() || null, payment_method: method,
        },
      }).unwrap();
      try { sessionStorage.setItem(`cravy-phone-${res.order_number}`, f.phone.trim()); } catch { /* private mode: the order page asks for the phone */ }
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="d" className="text-xl">Delivery details</h2>
            <button type="button" onClick={() => openLocationModal()} className="inline-flex min-h-[44px] items-center gap-2 rounded-pill border-2 border-forest/25 px-4 text-sm font-semibold text-forest transition hover:border-forest hover:bg-forest-100"><FiMapPin aria-hidden />{saved ? "Change area" : "Choose area"}</button>
          </div>
          {saved && (
            <div className="flex items-start gap-3 rounded-2xl bg-forest-100 p-4 text-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest text-lg text-cream"><FiMapPin aria-hidden /></span>
              <div className="min-w-0"><p className="font-bold text-forest">Delivering to {saved.area}, {saved.city}</p><p className="text-ink/70">Your delivery address is taken from this location. Add a landmark below to help the rider find you.</p></div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">Full name<input className={field} value={f.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} aria-describedby="name-err" /><Err k="name" /></label>
            <label className="block">Phone<input className={field} value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby="phone-err" /><Err k="phone" /></label>
            <label className="block">Email (optional)<input className={field} value={f.email} onChange={set("email")} type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby="email-err" /><Err k="email" /></label>
            <label className="block">City<input className={field} value={f.city} onChange={set("city")} autoComplete="address-level2" aria-invalid={!!errors.city} aria-describedby="city-err" /><Err k="city" /></label>
          </div>
          <div>
            {!hasNavLocation && (
              <>
                <p className="mb-1">Delivery location</p>
                <LocationPicker value={loc} onChange={onPin} invalid={!!errors.location || outOfRange} hideLocate={hideLocate} />
              </>
            )}
            <Err k="location" />
            {/* Only the charge that applies to THIS customer is shown (no price list). It appears once a location is set. */}
            {loc && quoting && !quote && (
              <p role="status" className="mt-3 flex items-center gap-2 rounded-2xl bg-forest-100 p-4 text-sm"><Loader2 className="animate-spin" aria-hidden />Checking delivery for your location…</p>
            )}
            {loc && quote && !quote.delivery_pending && (outOfRange ? (
              <div role="alert" className="mt-3 flex items-start gap-3 rounded-2xl border-2 border-strawberry/40 bg-strawberry/10 p-4 text-sm text-strawberry">
                <FiAlertCircle aria-hidden className="mt-0.5 shrink-0 text-lg" />
                <p>{quote.delivery_message ?? "Sorry, that location is outside our delivery range."} {hasNavLocation ? "Please choose a different area." : "Move the pin closer to the shop."}</p>
              </div>
            ) : hasNavLocation ? null : (
              <div role="status" aria-busy={quoting} className={`mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border-2 border-forest bg-forest-100 p-4 transition-opacity ${quoting ? "opacity-60" : ""}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest text-lg text-cream">{quoting ? <Loader2 className="animate-spin" aria-hidden /> : <FiTruck aria-hidden />}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-forest">Delivery to your location</p>
                    <p className="text-sm">{quote.distance_km != null ? <>{quote.distance_km.toFixed(1)} km from the shop</> : "Distance calculated"}{quote.delivery_band ? <span className="text-ink/60"> · {quote.delivery_band}</span> : null}</p>
                  </div>
                </div>
                <p className="font-display text-2xl font-extrabold text-forest">{quote.delivery_charge === 0 ? "FREE" : formatPKR(quote.delivery_charge)}</p>
              </div>
            ))}
          </div>
          <label className="block">Nearby landmark (optional)<input className={field} value={f.landmark} onChange={set("landmark")} /></label>
          <label className="block">Delivery instructions (optional)<textarea className={`${field} py-3`} rows={2} value={f.notes} onChange={set("notes")} /></label>
        </section>

        <fieldset className="card p-5 sm:p-6">
          <legend className="px-1 font-display text-xl font-extrabold text-forest">Payment method</legend>
          {!payMethods && !payError && <div className="mt-3 h-20 animate-pulse rounded-2xl bg-vanilla" aria-label="Loading payment methods" />}
          <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
            {methods.map(({ id, label, hint, icon: Icon }) => (
              <label key={id} className={`flex min-h-[72px] cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition focus-within:ring-2 focus-within:ring-forest/40 ${method === id ? "border-forest bg-forest-100" : "border-vanilla-deep bg-white hover:border-forest/50"}`}>
                <input type="radio" name="pay" className="sr-only" checked={method === id} onChange={() => setMethod(id)} />
                <Icon aria-hidden className="mt-1 shrink-0 text-forest" size={22} />
                <span className="flex flex-col"><span className="font-bold">{label}</span><span className="text-sm">{hint}</span></span>
              </label>
            ))}
          </div>
          {method === "COD" && (
            <p className="mt-4 rounded-2xl bg-forest-100 p-4 text-sm">
              <strong className="text-forest">Cash on Delivery.</strong> Place your order and we will bring it to you. Please keep {quote ? <strong>{formatPKR(quote.total)}</strong> : "the total"} ready in cash.
            </p>
          )}
          {method === "EASYPAISA" && (
            <div className="mt-4 space-y-2 rounded-2xl bg-forest-100 p-4 text-sm">
              <p className="flex items-center gap-2 font-bold text-forest"><FiLock aria-hidden /> How online payment works</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Place your order. You will see our Easypaisa number{easypaisa?.number ? <> (<strong className="font-mono">{easypaisa.number}</strong>)</> : null} and your exact amount{quote ? <> (<strong>{formatPKR(quote.total)}</strong>)</> : null}.</li>
                <li>Pay in the Easypaisa app, then enter your Transaction ID or upload a screenshot.</li>
                <li>We confirm the payment and start preparing your order.</li>
              </ol>
              <p className="text-xs text-ink/70">We never ask for your PIN, password or OTP.</p>
            </div>
          )}
        </fieldset>

        {quoteMsg && <p role="alert" className="rounded-2xl bg-strawberry/10 p-4 text-strawberry">{quoteMsg}</p>}
        {formError && <p role="alert" className="rounded-2xl bg-strawberry/10 p-4 text-strawberry">{formError}</p>}
        <button className="btn-primary w-full text-lg lg:hidden" disabled={isLoading || !methods.length || outOfRange}>{isLoading ? <Loader2 className="animate-spin" aria-label="Placing order" /> : `${method === "EASYPAISA" ? "Place order & pay" : "Place order"}${quote ? ` · ${formatPKR(quote.total)}` : ""}`}</button>
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
            <div className="flex justify-between"><dt>Delivery{quote.distance_km != null ? ` (${quote.distance_km.toFixed(1)} km)` : ""}</dt><dd>{quote.delivery_pending ? "Set your location" : outOfRange ? "Out of range" : quote.delivery_charge === 0 ? "FREE" : formatPKR(quote.delivery_charge)}</dd></div>
            {quote.discount_total > 0 && <div className="flex justify-between"><dt>Discount{quote.coupon_code ? ` (${quote.coupon_code})` : ""}</dt><dd>−{formatPKR(quote.discount_total)}</dd></div>}
            {quote.tax_total > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{formatPKR(quote.tax_total)}</dd></div>}
            <div className="flex justify-between text-lg font-bold text-forest"><dt>Total</dt><dd>{formatPKR(quote.total)}</dd></div>
          </dl>
        )}
        {quote?.delivery_pending && <p className="text-xs text-ink/70">Delivery is added once you set your location on the map.</p>}
        {quote && !quote.meets_minimum && <p role="alert" className="text-sm text-strawberry">Minimum order is {formatPKR(quote.min_order_value)}.</p>}
        <button type="button" onClick={(e) => submit(e as unknown as React.FormEvent)} disabled={isLoading || !methods.length || outOfRange} className="btn-primary hidden w-full lg:inline-flex">
          {isLoading ? <Loader2 className="animate-spin" aria-label="Placing order" /> : method === "EASYPAISA" ? "Place order & pay" : "Place order"}
        </button>
      </aside>
    </main>
  );
}