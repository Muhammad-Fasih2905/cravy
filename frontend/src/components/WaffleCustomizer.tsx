"use client";
import Image, { type StaticImageData } from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GiIceCreamCone } from "react-icons/gi";
import { FiArrowLeft, FiCheck, FiMinus, FiPlus, FiX } from "react-icons/fi";
import { PUBLIC_API as API } from "@/lib/config";
import { useGetWaffleOptionsQuery, type WaffleOptionItem } from "@/store/api";
import { fallbackToppingImage } from "@/config/waffleFlavours";
import type { FlavourPick } from "@/store/cartSlice";

/** How many free scoops the chosen waffle includes. Same rule as the server: "(4 Scoops)" -> 4 (exactly), "Without Ice Cream" -> 0, nothing mentioned -> 1 (optional). */
export function scoopsFor(names: (string | null | undefined)[]): { count: number; exact: boolean } {
  const list = names.filter((n): n is string => !!n).map((n) => n.toLowerCase());
  for (const n of list) {
    const m = n.match(/(\d+)\s*scoops?/);
    if (m) return { count: Number(m[1]), exact: true };
  }
  if (list.some((n) => n.includes("without") || n.includes("no ice"))) return { count: 0, exact: true };
  return { count: 1, exact: false };
}

export type WaffleChoice = { toppings: number[]; flavours: FlavourPick[]; toppingNames: string[]; flavourNames: string[] };

const src = (it: WaffleOptionItem, fallback: boolean): StaticImageData | string | null => {
  if (it.image_url) return it.image_url.startsWith("http") ? it.image_url : `${API}${it.image_url}`;
  return fallback ? fallbackToppingImage(it.name) : null;
};

/** One compact row: small photo, name, a "Free" tag and a tick (or a scoop stepper passed as children) on the right. */
function Tile({ item, image, selected, badge, onClick, children }: {
  item: WaffleOptionItem; image: StaticImageData | string | null; selected: boolean; badge?: string; onClick: () => void; children?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-white p-2 pr-3 ring-2 transition ${selected ? "bg-forest/[0.04] ring-forest shadow-card" : "ring-vanilla-deep/60 hover:ring-forest/40"}`}>
      <button type="button" onClick={onClick} aria-pressed={selected} aria-label={item.name} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-vanilla to-mint sm:h-16 sm:w-16">
          {image ? (
            <Image src={image} alt="" fill sizes="64px" className="object-cover" unoptimized={typeof image === "string" && API.includes("localhost")}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
          ) : <span className="grid h-full place-items-center text-forest/40" aria-hidden><GiIceCreamCone size={26} /></span>}
          {badge && <span aria-hidden className="absolute bottom-0 right-0 rounded-tl-lg bg-forest px-1.5 py-0.5 text-[0.7rem] font-extrabold text-cream">{badge}</span>}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="line-clamp-2 block text-[0.95rem] font-bold text-ink">{item.name}</span>
          <span className="mt-1 inline-block rounded-full bg-mint/60 px-2 py-0.5 text-[0.68rem] font-extrabold uppercase tracking-wide text-forest">Free</span>
        </span>
      </button>
      {children ?? (
        <button type="button" onClick={onClick} tabIndex={-1} aria-hidden className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 transition ${selected ? "border-forest bg-forest text-cream" : "border-ink/25 bg-white"}`}>{selected && <FiCheck size={16} />}</button>
      )}
    </div>
  );
}

/**
 * The guided "Add" flow for a waffle: step 1 toppings (free, any number), step 2 ice-cream flavours (free, as many scoops as the waffle includes).
 * Bottom sheet on phones, centred dialog on larger screens. Calls onDone with the choices; the server validates and saves them with the order.
 */
export function WaffleCustomizer({ name, summary, scoops, exact, onClose, onDone }: {
  name: string; summary: string; scoops: number; exact: boolean; onClose: () => void; onDone: (c: WaffleChoice) => void;
}) {
  const { data, isLoading, isError, refetch } = useGetWaffleOptionsQuery(undefined, { refetchOnMountOrArgChange: true });
  const toppings = data?.toppings ?? [];
  const flavours = data?.flavours ?? [];
  const wantsIce = scoops > 0 && (flavours.length > 0 || exact);
  const [step, setStep] = useState<1 | 2>(1);
  const [tops, setTops] = useState<number[]>([]);
  const [picks, setPicks] = useState<Record<number, number>>({});

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [onClose]);

  const total = useMemo(() => Object.values(picks).reduce((a, b) => a + b, 0), [picks]);
  const left = scoops - total;
  const noToppings = !isLoading && toppings.length === 0;
  const steps = (toppings.length > 0 ? 1 : 0) + (wantsIce ? 1 : 0);
  const stage: 1 | 2 | 0 = isLoading ? 1 : noToppings ? (wantsIce ? 2 : 0) : step;

  const finish = () => {
    const tp = toppings.filter((t) => tops.includes(t.id));
    const fl = flavours.filter((f) => (picks[f.id] ?? 0) > 0);
    onDone({
      toppings: tp.map((t) => t.id), toppingNames: tp.map((t) => t.name),
      flavours: fl.map((f) => ({ id: f.id, qty: picks[f.id] })),
      flavourNames: fl.map((f) => `${f.name}${picks[f.id] > 1 ? ` ×${picks[f.id]}` : ""}`),
    });
  };
  // Nothing to choose (no toppings, no ice cream): add straight away.
  useEffect(() => { if (!isLoading && !isError && stage === 0) { onDone({ toppings: [], flavours: [], toppingNames: [], flavourNames: [] }); } }, [isLoading, isError, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const addScoop = (id: number) => setPicks((c) => (total >= scoops ? c : { ...c, [id]: (c[id] ?? 0) + 1 }));
  const removeScoop = (id: number) => setPicks((c) => { const n = { ...c, [id]: Math.max(0, (c[id] ?? 0) - 1) }; if (!n[id]) delete n[id]; return n; });
  const canFinish = !exact || total === scoops;
  const onFirstStepNext = () => { if (wantsIce) setStep(2); else finish(); };

  return (
    <motion.div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/55 backdrop-blur-[2px] sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div role="dialog" aria-modal="true" aria-label={`Customise ${name}`}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-cream shadow-lift sm:max-w-2xl sm:rounded-[1.75rem]">
        {/* header */}
        <div className="flex items-start gap-3 border-b border-vanilla-deep/60 px-5 pb-3 pt-4">
          {stage === 2 && toppings.length > 0 ? (
            <button type="button" onClick={() => setStep(1)} aria-label="Back to toppings" className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-vanilla text-forest"><FiArrowLeft /></button>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold uppercase tracking-wide text-forest/60">{name}{summary ? ` · ${summary}` : ""}</p>
            <h2 className="text-xl font-extrabold leading-tight text-forest sm:text-2xl">{stage === 2 ? "Choose your ice cream" : "Choose your toppings"}</h2>
            <p className="mt-0.5 text-sm text-ink/65">
              {stage === 2
                ? scoops === 1 ? "1 scoop included, free of charge" : `${scoops} scoops included, free. Pick the flavours you love${scoops > 1 ? " (the same flavour can repeat)" : ""}.`
                : "Free, pick as many as you like (or none)"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-vanilla text-forest"><FiX /></button>
        </div>
        {steps > 1 && (
          <div className="flex gap-1.5 px-5 pt-3" aria-hidden>
            {[1, 2].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= stage ? "bg-forest" : "bg-vanilla-deep"}`} />)}
          </div>
        )}

        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading && <div className="grid grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-vanilla" />)}</div>}
          {isError && (
            <div className="rounded-2xl bg-white p-5 text-center">
              <p className="font-semibold text-ink">Could not load the choices.</p>
              <button type="button" onClick={() => refetch()} className="btn-secondary mt-3">Try again</button>
            </div>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {!isLoading && !isError && stage === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="grid gap-2.5 sm:grid-cols-2">
                {toppings.map((t) => {
                  const on = tops.includes(t.id);
                  return <Tile key={t.id} item={t} image={src(t, true)} selected={on} onClick={() => setTops((c) => (on ? c.filter((x) => x !== t.id) : [...c, t.id]))} />;
                })}
              </motion.div>
            )}
            {!isLoading && !isError && stage === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }}>
                {flavours.length === 0 ? <p className="rounded-2xl bg-white p-5 text-center text-ink/70">No ice-cream flavours are available right now.</p> : (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {flavours.map((f) => {
                      const n = picks[f.id] ?? 0;
                      return (
                        <Tile key={f.id} item={f} image={src(f, false)} selected={n > 0} badge={undefined} onClick={() => (scoops === 1 ? setPicks({ [f.id]: n ? 0 : 1 }) : addScoop(f.id))}>
                          {scoops > 1 && (
                            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-vanilla px-0.5 py-0.5">
                              <button type="button" onClick={() => removeScoop(f.id)} disabled={n === 0} aria-label={`Remove one ${f.name}`} className="grid h-9 w-9 place-items-center rounded-full text-forest disabled:opacity-30"><FiMinus /></button>
                              <span className="w-5 text-center text-sm font-extrabold text-forest" aria-live="polite">{n}</span>
                              <button type="button" onClick={() => addScoop(f.id)} disabled={left <= 0} aria-label={`Add one ${f.name}`} className="grid h-9 w-9 place-items-center rounded-full bg-forest text-cream disabled:opacity-30"><FiPlus /></button>
                            </span>
                          )}
                        </Tile>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* footer */}
        {!isLoading && !isError && stage !== 0 && (
          <div className="flex items-center gap-3 border-t border-vanilla-deep/60 bg-white/70 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <p className="min-w-0 flex-1 text-sm font-semibold text-ink/75">
              {stage === 1
                ? tops.length ? `${tops.length} topping${tops.length > 1 ? "s" : ""} selected` : "No topping selected"
                : scoops > 1 ? (left > 0 ? `${left} scoop${left > 1 ? "s" : ""} left to choose` : "All scoops chosen") : total ? "1 scoop chosen" : exact ? "Pick 1 flavour" : "Optional"}
            </p>
            {stage === 1 ? (
              <button type="button" className="btn-primary min-h-[48px] px-6" onClick={onFirstStepNext}>{wantsIce ? "Next: Ice cream" : "Add to cart"}</button>
            ) : (
              <>
                {!exact && total === 0 && <button type="button" className="btn-secondary min-h-[48px] px-4" onClick={finish}>Skip</button>}
                <button type="button" className="btn-primary min-h-[48px] px-6 disabled:opacity-50" disabled={!canFinish || (!exact && total === 0)} onClick={finish}>Add to cart</button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * The same two choices shown directly on the waffle's own page (no pop-up): toppings, then ice-cream flavours.
 * Reports the current choice to the parent; `valid` is false while the exact scoop count has not been reached yet.
 */
export function WaffleInline({ scoops, exact, onChange }: { scoops: number; exact: boolean; onChange: (c: WaffleChoice, valid: boolean) => void }) {
  const { data, isLoading, isError, refetch } = useGetWaffleOptionsQuery(undefined, { refetchOnMountOrArgChange: true });
  const toppings = data?.toppings ?? [];
  const flavours = data?.flavours ?? [];
  const [tops, setTops] = useState<number[]>([]);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const total = Object.values(picks).reduce((a, b) => a + b, 0);
  const left = scoops - total;
  const showIce = scoops > 0 && flavours.length > 0;

  // a scoop count that changed (another size picked) can leave too many scoops chosen: start that part over
  useEffect(() => { setPicks((c) => (Object.values(c).reduce((a, b) => a + b, 0) > scoops ? {} : c)); }, [scoops]);
  useEffect(() => {
    const tp = toppings.filter((t) => tops.includes(t.id));
    const fl = scoops > 0 ? flavours.filter((f) => (picks[f.id] ?? 0) > 0) : [];
    const used = fl.reduce((a, f) => a + picks[f.id], 0);
    onChange({
      toppings: tp.map((t) => t.id), toppingNames: tp.map((t) => t.name),
      flavours: fl.map((f) => ({ id: f.id, qty: picks[f.id] })),
      flavourNames: fl.map((f) => `${f.name}${picks[f.id] > 1 ? ` ×${picks[f.id]}` : ""}`),
    }, scoops === 0 || flavours.length === 0 || !exact ? used <= scoops : used === scoops);
  }, [tops, picks, data, scoops, exact]); // eslint-disable-line react-hooks/exhaustive-deps

  const addScoop = (id: number) => setPicks((c) => (total >= scoops ? c : { ...c, [id]: (c[id] ?? 0) + 1 }));
  const removeScoop = (id: number) => setPicks((c) => { const n = { ...c, [id]: Math.max(0, (c[id] ?? 0) - 1) }; if (!n[id]) delete n[id]; return n; });

  if (isLoading) return <div className="grid grid-cols-3 gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-vanilla" />)}</div>;
  if (isError) return <button type="button" onClick={() => refetch()} className="btn-secondary">Could not load toppings. Try again</button>;
  return (
    <div className="space-y-5">
      {toppings.length > 0 && (
        <section aria-label="Toppings">
          <h3 className="text-[0.85rem] font-extrabold uppercase tracking-wide text-forest sm:text-sm">Toppings <span className="font-semibold normal-case tracking-normal text-ink/60">· free, pick any</span></h3>
          <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
            {toppings.map((t) => {
              const on = tops.includes(t.id);
              return <Tile key={t.id} item={t} image={src(t, true)} selected={on} onClick={() => setTops((c) => (on ? c.filter((x) => x !== t.id) : [...c, t.id]))} />;
            })}
          </div>
        </section>
      )}
      {showIce && (
        <section aria-label="Ice cream">
          <h3 className="text-[0.85rem] font-extrabold uppercase tracking-wide text-forest sm:text-sm">
            Ice cream <span className="font-semibold normal-case tracking-normal text-ink/60">· free, {scoops === 1 ? "pick 1 flavour" : `choose ${scoops} scoops`}{exact ? "" : " (optional)"}</span>
          </h3>
          {scoops > 1 && <p className="mt-0.5 text-xs font-semibold text-ink/65" aria-live="polite">{left > 0 ? `${left} scoop${left > 1 ? "s" : ""} left to choose` : "All scoops chosen"}</p>}
          <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
            {flavours.map((f) => {
              const n = picks[f.id] ?? 0;
              return (
                <Tile key={f.id} item={f} image={src(f, false)} selected={n > 0} badge={undefined} onClick={() => (scoops === 1 ? setPicks(n ? {} : { [f.id]: 1 }) : addScoop(f.id))}>
                  {scoops > 1 && (
                    <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-vanilla px-0.5 py-0.5">
                      <button type="button" onClick={() => removeScoop(f.id)} disabled={n === 0} aria-label={`Remove one ${f.name}`} className="grid h-9 w-9 place-items-center rounded-full text-forest disabled:opacity-30"><FiMinus /></button>
                      <span className="w-5 text-center text-sm font-extrabold text-forest">{n}</span>
                      <button type="button" onClick={() => addScoop(f.id)} disabled={left <= 0} aria-label={`Add one ${f.name}`} className="grid h-9 w-9 place-items-center rounded-full bg-forest text-cream disabled:opacity-30"><FiPlus /></button>
                    </span>
                  )}
                </Tile>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}