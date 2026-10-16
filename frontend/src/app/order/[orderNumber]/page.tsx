import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiCheckCircle as CheckCircle2 } from "react-icons/fi";
import { formatPKR } from "@/lib/money";
import type { OrderResult, PublicSettings } from "@/lib/types";
import { PaymentReferenceForm } from "@/components/PaymentReferenceForm";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };
const API = process.env.API_URL ?? "http://localhost:8000";
const STEPS = ["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY", "DELIVERED"];
const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export default async function OrderPage({ params }: { params: { orderNumber: string } }) {
  const [oRes, sRes] = await Promise.all([
    fetch(`${API}/api/orders/${params.orderNumber}`, { cache: "no-store" }),
    fetch(`${API}/api/settings`, { cache: "no-store" }),
  ]);
  if (oRes.status === 404) notFound();
  if (!oRes.ok || !sRes.ok) throw new Error("Could not load your order");
  const o: OrderResult = await oRes.json();
  const s: PublicSettings & Record<string, string | null> = await sRes.json();
  const idx = STEPS.indexOf(o.status);
  const cancelled = o.status === "CANCELLED";

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-5 py-10">
      <div className="text-center">
        <CheckCircle2 className="mx-auto text-forest" size={56} aria-hidden />
        <h1 className="mt-3 text-4xl">Order placed!</h1>
        <p className="mt-2">Your order number is <strong className="font-mono">{o.order_number}</strong></p>
      </div>

      <section className="card p-6" aria-label="Order status">
        <h2 className="mb-4 text-xl">{cancelled ? "Order cancelled" : "Status"}</h2>
        {!cancelled && (
          <ol className="space-y-3">
            {STEPS.map((st, i) => (
              <li key={st} className={`flex items-center gap-3 ${i <= idx ? "font-bold text-forest" : "text-ink/50"}`} aria-current={i === idx ? "step" : undefined}>
                <span className={`h-3 w-3 rounded-full ${i <= idx ? "bg-mango" : "bg-vanilla-deep"}`} aria-hidden />{label(st)}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card space-y-3 p-6" aria-label="Payment">
        <h2 className="text-xl">Payment</h2>
        <p>Amount to pay: <strong className="text-forest">{formatPKR(o.total)}</strong></p>
        {o.payment_method === "COD" && <p>Please keep <strong>{formatPKR(o.total)}</strong> ready in cash when your order arrives.</p>}
        {o.payment_method === "EASYPAISA" && (
          <div className="space-y-1">
            <p>Send <strong>{formatPKR(o.total)}</strong> via Easypaisa to:</p>
            <p>Account name: <strong>{s.easypaisa_name ?? "Not set yet, please contact us"}</strong></p>
            <p>Number: <strong>{s.easypaisa_number ?? "Not set yet"}</strong></p>
            <p>Use <strong>{o.order_number}</strong> as the reference, then submit your transaction ID below.</p>
          </div>
        )}
        {o.payment_method === "BANK_TRANSFER" && (
          <div className="space-y-1">
            <p>Transfer <strong>{formatPKR(o.total)}</strong> to:</p>
            <p>Bank: <strong>{s.bank_name ?? "Not set yet"}</strong></p>
            <p>Account title: <strong>{s.bank_account_title ?? "Not set yet"}</strong></p>
            <p>Account number: <strong>{s.bank_account_number ?? "Not set yet"}</strong></p>
            <p>IBAN: <strong>{s.bank_iban ?? "Not set yet"}</strong></p>
            <p>Use <strong>{o.order_number}</strong> as the reference, then submit your transaction ID below.</p>
          </div>
        )}
        <p className="text-sm">Payment status: <span className="chip">{label(o.payment_status)}</span></p>
        {o.payment_method !== "COD" && o.payment_status !== "PAID" && <PaymentReferenceForm orderNumber={o.order_number} />}
      </section>

      <Link href="/menu" className="btn-secondary w-full">Order something else</Link>
    </main>
  );
}
