"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiLoader, FiUploadCloud, FiX } from "react-icons/fi";
import { PUBLIC_API, RECEIPT_MAX_MB, RECEIPT_TYPES, TID_PATTERN } from "@/lib/config";

const field = "mt-1 min-h-[48px] w-full rounded-2xl border-2 border-vanilla-deep bg-white px-4 focus-visible:border-forest";

/** FastAPI sends `detail` as a string for our errors and as a list for validation errors. */
function readDetail(body: unknown, fallback: string): string {
  const d = (body as { detail?: unknown })?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    const loc = JSON.stringify(d);
    if (loc.includes("transaction_ref")) return "That Transaction ID does not look right. It should be 6 to 40 letters or digits.";
    if (loc.includes("phone")) return "Please enter the phone number you used at checkout.";
  }
  return fallback;
}

export function PaymentReferenceForm({ orderNumber, resubmit = false }: { orderNumber: string; resubmit?: boolean }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [ref, setRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState<{ ref?: string; file?: string; phone?: string }>({});

  useEffect(() => {
    try { setPhone(sessionStorage.getItem(`cravy-phone-${orderNumber}`) ?? ""); } catch { /* private mode */ }
  }, [orderNumber]);

  const preview = useMemo(() => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pick(f: File | null) {
    setFieldErr((e) => ({ ...e, file: undefined }));
    if (!f) return setFile(null);
    if (!RECEIPT_TYPES.includes(f.type)) return setFieldErr((e) => ({ ...e, file: "Please choose a JPG, PNG, WEBP or PDF file." }));
    if (f.size > RECEIPT_MAX_MB * 1024 * 1024) return setFieldErr((e) => ({ ...e, file: `The file is larger than ${RECEIPT_MAX_MB} MB.` }));
    setFile(f);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const tid = ref.trim();
    const errs: typeof fieldErr = {};
    if (!tid && !file) errs.ref = "Enter your Transaction ID or upload a screenshot.";
    if (tid && !TID_PATTERN.test(tid)) errs.ref = "The Transaction ID should be 6 to 40 letters or digits (no spaces).";
    if (phone.replace(/\D/g, "").length < 10) errs.phone = "Enter the phone number you used at checkout.";
    setFieldErr((p) => ({ ...p, ...errs, file: p.file }));
    if (Object.keys(errs).length) return;

    setState("sending");
    const base = `${PUBLIC_API}/api/orders/${encodeURIComponent(orderNumber)}`;
    try {
      // 1) Transaction ID (JSON)
      if (tid) {
        const r = await fetch(`${base}/payment-reference`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction_ref: tid, phone: phone.trim() }),
        });
        if (!r.ok) throw new Error(readDetail(await r.json().catch(() => null), "Could not save your Transaction ID."));
      }
      // 2) Screenshot (multipart)
      if (file) {
        const fd = new FormData();
        fd.append("phone", phone.trim());
        fd.append("file", file);
        const r = await fetch(`${base}/receipt`, { method: "POST", body: fd });
        if (!r.ok) throw new Error(readDetail(await r.json().catch(() => null), "Could not upload your screenshot."));
      }
      setState("done");
      router.refresh(); // reload the order so the status flips to "Verifying"
    } catch (err) {
      setError(err instanceof TypeError ? "Network problem. Please check your connection and try again." : err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("idle");
    }
  }

  if (state === "done")
    return (
      <p role="status" className="flex items-start gap-3 rounded-2xl bg-mint/40 p-4">
        <FiCheckCircle aria-hidden className="mt-0.5 shrink-0 text-forest" size={20} />
        <span>Thank you! We have your payment details and will confirm your payment shortly. This page updates by itself.</span>
      </p>
    );

  return (
    <form onSubmit={send} noValidate className="space-y-4">
      <p className="text-sm text-ink/80">{resubmit ? "Sent the wrong details? You can send them again." : "After you pay in the Easypaisa app, send us proof so we can confirm it."}</p>

      <label className="block text-sm font-semibold">Easypaisa Transaction ID (TID)
        <input value={ref} onChange={(e) => setRef(e.target.value.replace(/\s/g, ""))} autoCapitalize="characters" autoComplete="off" spellCheck={false}
          placeholder="e.g. 41234567890" className={`${field} font-mono`} aria-invalid={!!fieldErr.ref} aria-describedby={fieldErr.ref ? "tid-err" : undefined} />
        {fieldErr.ref && <span id="tid-err" role="alert" className="mt-1 block text-sm font-normal text-strawberry">{fieldErr.ref}</span>}
      </label>

      <div>
        <p className="text-sm font-semibold">Payment screenshot <span className="font-normal text-ink/60">(optional, up to {RECEIPT_MAX_MB} MB)</span></p>
        {file ? (
          <div className="mt-1 flex items-center gap-3 rounded-2xl border-2 border-vanilla-deep bg-white p-3">
            {preview
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={preview} alt="Screenshot preview" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-vanilla text-xs font-bold">PDF</span>}
            <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
            <button type="button" onClick={() => pick(null)} aria-label="Remove file" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-strawberry/10"><FiX aria-hidden /></button>
          </div>
        ) : (
          <label className="mt-1 flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-vanilla-deep bg-white px-4 py-3 text-sm font-semibold text-forest transition hover:border-forest focus-within:border-forest">
            <FiUploadCloud aria-hidden /> Choose screenshot
            <input type="file" accept={RECEIPT_TYPES.join(",")} className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          </label>
        )}
        {fieldErr.file && <p role="alert" className="mt-1 text-sm text-strawberry">{fieldErr.file}</p>}
      </div>

      <label className="block text-sm font-semibold">Phone number used at checkout
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" className={field} aria-invalid={!!fieldErr.phone} aria-describedby={fieldErr.phone ? "ph-err" : undefined} />
        {fieldErr.phone && <span id="ph-err" role="alert" className="mt-1 block text-sm font-normal text-strawberry">{fieldErr.phone}</span>}
      </label>

      {error && <p role="alert" className="rounded-2xl bg-strawberry/10 p-3 text-sm text-strawberry">{error}</p>}
      <button className="btn-primary w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" ? <><FiLoader className="animate-spin" aria-hidden /> Sending…</> : "Submit payment proof"}
      </button>
    </form>
  );
}