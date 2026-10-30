"use client";
import { useCallback, useState } from "react";
import { FiCheck, FiClock, FiCopy, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { formatPKR } from "@/lib/money";
import type { OrderResult } from "@/lib/types";
import { PaymentReferenceForm } from "./PaymentReferenceForm";

function CopyRow({ label, value, shown, mono = true }: { label: string; value: string; shown?: string; mono?: boolean }) {
    const [copied, setCopied] = useState(false);
    const copy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(value);
        } catch { // older browsers / non-https: fall back to a hidden textarea
            const t = document.createElement("textarea");
            t.value = value; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
            document.body.appendChild(t); t.select();
            try { document.execCommand("copy"); } finally { document.body.removeChild(t); }
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    }, [value]);
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 ring-1 ring-vanilla-deep sm:p-4">
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</p>
                <p className={`truncate text-lg font-extrabold text-forest sm:text-xl ${mono ? "font-mono" : ""}`}>{shown ?? value}</p>
            </div>
            <button type="button" onClick={copy} className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-pill border-2 border-forest px-4 text-sm font-bold text-forest transition hover:bg-forest hover:text-cream" aria-label={`Copy ${label}`}>
                {copied ? <FiCheck aria-hidden /> : <FiCopy aria-hidden />}<span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
            </button>
        </div>
    );
}

export function PaymentPanel({ order: o }: { order: OrderResult }) {
    const status = o.payment_status;
    const ins = o.payment_instructions;

    if (o.payment_method === "COD")
        return o.status === "COMPLETED" || status === "PAID" ? (
            <p role="status" className="flex items-start gap-3 rounded-2xl bg-mint/40 p-4">
                <FiCheckCircle aria-hidden className="mt-0.5 shrink-0 text-forest" size={22} />
                <span><strong>Cash received. Thank you!</strong> Your order is complete.</span>
            </p>
        ) : (
            <div className="space-y-2">
                <p>Cash on Delivery: please keep <strong>{formatPKR(o.total)}</strong> ready in cash when your order arrives.</p>
                <p className="text-sm">Payment status: <span className="chip">Pay on delivery</span></p>
            </div>
        );

    if (status === "PAID")
        return (
            <p role="status" className="flex items-start gap-3 rounded-2xl bg-mint/40 p-4">
                <FiCheckCircle aria-hidden className="mt-0.5 shrink-0 text-forest" size={22} />
                <span><strong>Payment confirmed.</strong> Thank you! We are getting your order ready.</span>
            </p>
        );

    if (status === "REFUNDED") return <p className="rounded-2xl bg-vanilla p-4">This payment was refunded.</p>;

    return (
        <div className="space-y-5">
            {status === "PENDING_VERIFICATION" && (
                <p role="status" className="flex items-start gap-3 rounded-2xl bg-mango/25 p-4">
                    <FiClock aria-hidden className="mt-0.5 shrink-0 text-forest" size={22} />
                    <span><strong>We received your payment details.</strong> We are checking them in our Easypaisa account. Your order is prepared as soon as it is confirmed. This page updates by itself.</span>
                </p>
            )}
            {status === "FAILED" && (
                <p role="alert" className="flex items-start gap-3 rounded-2xl bg-strawberry/10 p-4 text-strawberry">
                    <FiAlertTriangle aria-hidden className="mt-0.5 shrink-0" size={22} />
                    <span><strong>We could not confirm this payment.</strong> Please check the amount and Transaction ID, then send your proof again. If you have not paid yet, pay using the details below.</span>
                </p>
            )}

            {ins ? (
                <section aria-label="Easypaisa payment details" className="space-y-3 rounded-card bg-forest-100 p-4 sm:p-5">
                    <h3 className="font-display text-lg font-extrabold text-forest">Pay with Easypaisa</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <CopyRow label="Easypaisa number" value={ins.account_number} />
                        <CopyRow label="Amount to send" value={String(ins.amount)} shown={formatPKR(ins.amount)} />
                    </div>
                    {ins.account_name && <p className="text-sm">Account name: <strong>{ins.account_name}</strong></p>}
                    <CopyRow label="Payment note / reference" value={ins.reference} />
                    <ol className="list-decimal space-y-1 pl-5 text-sm">
                        <li>Open the <strong>Easypaisa</strong> app and choose <strong>Send Money</strong>.</li>
                        <li>Send exactly <strong>{formatPKR(ins.amount)}</strong> to <strong>{ins.account_number}</strong>.</li>
                        <li>Write <strong>{ins.reference}</strong> in the payment note.</li>
                        <li>Come back here and enter your Transaction ID or upload a screenshot.</li>
                    </ol>
                    <p className="text-xs text-ink/70">We never ask for your PIN, password or OTP. Only pay to the number shown above.</p>
                </section>
            ) : null}

            {status === "PENDING_VERIFICATION" ? (
                <details className="rounded-2xl border-2 border-vanilla-deep p-4">
                    <summary className="cursor-pointer text-sm font-bold text-forest">Send different payment details</summary>
                    <div className="mt-3"><PaymentReferenceForm orderNumber={o.order_number} resubmit /></div>
                </details>
            ) : (
                <PaymentReferenceForm orderNumber={o.order_number} resubmit={status === "FAILED"} />
            )}
        </div>
    );
}