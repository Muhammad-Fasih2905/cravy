import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiCheckCircle as CheckCircle2 } from "react-icons/fi";
import { formatPKR } from "@/lib/money";
import { SERVER_API as API } from "@/lib/config";
import type { OrderResult } from "@/lib/types";
import { PaymentPanel } from "@/components/PaymentPanel";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };
export const dynamic = "force-dynamic"; // always show the live order and payment status

const STEPS = ["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY", "DELIVERED"];
const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export default async function OrderPage({ params }: { params: { orderNumber: string } }) {
  const res = await fetch(`${API}/api/orders/${encodeURIComponent(params.orderNumber)}`, { cache: "no-store" });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error("Could not load your order");
  const o: OrderResult = await res.json();
  const idx = STEPS.indexOf(o.status);
  const cancelled = o.status === "CANCELLED";
  const online = o.payment_method !== "COD";
  const needsPayment = online && !["PAID", "REFUNDED"].includes(o.payment_status) && !cancelled;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-5 sm:py-10">
      <div className="text-center">
        <CheckCircle2 className="mx-auto text-forest" size={56} aria-hidden />
        <h1 className="mt-3 text-3xl sm:text-4xl">{needsPayment ? "Order placed, payment due" : "Order placed!"}</h1>
        <p className="mt-2">Your order number is <strong className="break-all font-mono">{o.order_number}</strong></p>
        {needsPayment && <p className="mx-auto mt-2 max-w-md text-sm">Pay with Easypaisa below. We start preparing your order once the payment is confirmed.</p>}
      </div>

      {!cancelled && (
        <section className="card space-y-3 p-5 sm:p-6" aria-label="Payment">
          <h2 className="text-xl">Payment</h2>
          <p>Total: <strong className="text-forest">{formatPKR(o.total)}</strong></p>
          <PaymentPanel order={o} />
        </section>
      )}

      <section className="card p-5 sm:p-6" aria-label="Order status">
        <h2 className="mb-4 text-xl">{cancelled ? "Order cancelled" : "Status"}</h2>
        {!cancelled && (
          <ol className="space-y-3">
            {STEPS.map((st, i) => (
              <li key={st} className={`flex items-center gap-3 ${i <= idx ? "font-bold text-forest" : "text-ink/50"}`} aria-current={i === idx ? "step" : undefined}>
                <span className={`h-3 w-3 shrink-0 rounded-full ${i <= idx ? "bg-mango" : "bg-vanilla-deep"}`} aria-hidden />{label(st)}
              </li>
            ))}
          </ol>
        )}
      </section>

      <Link href="/menu" className="btn-secondary w-full">Order something else</Link>
    </main>
  );
}