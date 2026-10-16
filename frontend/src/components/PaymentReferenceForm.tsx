"use client";
import { useEffect, useState } from "react";

export function PaymentReferenceForm({ orderNumber }: { orderNumber: string }) {
  const [phone, setPhone] = useState("");
  const [ref, setRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  useEffect(() => { setPhone(sessionStorage.getItem(`cravy-phone-${orderNumber}`) ?? ""); }, [orderNumber]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending"); setError("");
    try {
      const base = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/orders/${orderNumber}`;
      const fail = async (r: Response) => { throw new Error((await r.json().catch(() => ({}))).detail ?? "Could not save your payment details"); };
      if (ref.trim()) {
        const r = await fetch(`${base}/payment-reference`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transaction_ref: ref, phone }) });
        if (!r.ok) await fail(r);
      }
      if (file) {
        const fd = new FormData(); fd.append("phone", phone); fd.append("file", file);
        const r = await fetch(`${base}/receipt`, { method: "POST", body: fd });
        if (!r.ok) await fail(r);
      }
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error, please try again");
      setState("idle");
    }
  }

  if (state === "done") return <p role="status" className="rounded-2xl bg-mint/40 p-4">Thanks! We have your reference and will verify the payment soon.</p>;
  return (
    <form onSubmit={send} className="space-y-3">
      <label className="block text-sm font-semibold">Transaction ID / reference
        <input minLength={4} value={ref} onChange={(e) => setRef(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-2xl border-2 border-vanilla-deep bg-white px-4" />
      </label>
      <label className="block text-sm font-semibold">Receipt photo or PDF (optional, up to 5 MB)
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm" />
      </label>
      <label className="block text-sm font-semibold">Phone used for the order
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className="mt-1 min-h-[48px] w-full rounded-2xl border-2 border-vanilla-deep bg-white px-4" />
      </label>
      {error && <p role="alert" className="text-sm text-strawberry">{error}</p>}
      <button className="btn-primary" disabled={state === "sending" || (!ref.trim() && !file)}>{state === "sending" ? "Sending…" : "Submit payment proof"}</button>
    </form>
  );
}
