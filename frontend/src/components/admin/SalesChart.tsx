"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { formatPKR } from "@/lib/money";
import { useAdminSalesQuery, type SalesReport } from "@/store/api";

/** What the admin is looking at: a whole year (bar per month), one month (bar per day), the last N days, or one single day (bar per hour). */
type View = { kind: "month"; year: number; month: number } | { kind: "year"; year: number } | { kind: "days"; days: number } | { kind: "day"; date: string };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const compact = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k` : String(Math.round(n)));
const pad = (n: number) => String(n).padStart(2, "0");
const dayOf = (key: string) => { const [y, m, d] = key.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (key: string, n: number) => { const d = dayOf(key); d.setDate(d.getDate() + n); return keyOf(d); };
const hour12 = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;

/** Rounds the top of the chart up to 1, 2, 5 or 10 x 10^n so the five grid lines are round numbers. */
function niceMax(v: number) {
  if (v <= 0) return 1000;
  const e = 10 ** Math.floor(Math.log10(v));
  const f = v / e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e;
}

const fullLabel = (key: string, mode: SalesReport["mode"]) => {
  if (mode === "year") return `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
  if (mode === "day") { const h = Number(key.slice(11, 13)); return `${hour12(h)} – ${hour12((h + 1) % 24)}`; }
  return dayOf(key).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

export function SalesChart() {
  const now = new Date();
  const [view, setView] = useState<View>({ kind: "month", year: now.getFullYear(), month: now.getMonth() + 1 });
  const args = view.kind === "days" ? { days: view.days } : view.kind === "day" ? { date: view.date } : view.kind === "year" ? { year: view.year, month: 0 } : { year: view.year, month: view.month };
  // Tagged "Stats": the live order stream refreshes it the moment an order is completed, cancelled or created.
  const { data, isFetching, isError } = useAdminSalesQuery(args);
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  useEffect(() => { setHover(null); setPinned(null); }, [view]);

  const points = data?.points ?? [];
  const active = hover ?? pinned;
  const top = useMemo(() => niceMax(Math.max(0, ...points.map((p) => p.total))), [points]);
  const best = data?.best?.key;
  const n = points.length;
  const step = n > 24 ? 3 : n > 12 ? 2 : 1;
  const title =
    view.kind === "days" ? `Last ${view.days} days`
    : view.kind === "year" ? `${view.year}`
    : view.kind === "day" ? dayOf(view.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : `${MONTHS[view.month - 1]} ${view.year}`;
  const prevLabel = !data ? "" : data.mode === "year" ? `${data.year - 1}${data.partial ? " (same period)" : ""}`
    : data.mode === "days" ? `the ${data.days} days before`
    : data.mode === "day" ? `the day before${data.partial ? " (full day)" : ""}`
    : `${MONTHS[(data.month + 10) % 12]}${data.month === 1 ? ` ${data.year - 1}` : ""}${data.partial ? " (same days)" : ""}`;

  // ‹ › arrows: step to the previous / next month, year or day, never before the first sale and never into the future
  const limits = data ? { first: data.first_sale ?? data.current, cur: data.current, today: data.today } : null;
  const target = (dir: -1 | 1): View | null => {
    if (!limits || view.kind === "days") return null;
    if (view.kind === "year") { const y = view.year + dir; return y >= limits.first.year && y <= limits.cur.year ? { kind: "year", year: y } : null; }
    if (view.kind === "month") {
      const i = view.year * 12 + view.month - 1 + dir;
      const lo = limits.first.year * 12 + limits.first.month - 1, hi = limits.cur.year * 12 + limits.cur.month - 1;
      return i >= lo && i <= hi ? { kind: "month", year: Math.floor(i / 12), month: (i % 12) + 1 } : null;
    }
    const d = addDays(view.date, dir);
    return d >= `${limits.first.year}-${pad(limits.first.month)}-01` && d <= limits.today ? { kind: "day", date: d } : null;
  };
  const prev = target(-1), next = target(1);
  const pinnedPoint = pinned !== null && data ? data.points[pinned] : null;

  return (
    <section className="card relative p-5 sm:p-6" aria-label="Sales received">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl">Sales received</h2>
            <span className="chip gap-1.5 bg-mint/40 text-xs"><span className="h-2 w-2 animate-pulse rounded-full bg-mint-deep" />Live</span>
          </div>
          <p className="mt-0.5 text-sm text-ink/70">{title}{isFetching && data ? " · updating…" : ""}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Previous" disabled={!prev} onClick={() => prev && setView(prev)} className="grid h-11 w-11 place-items-center rounded-full border-2 border-forest text-forest transition hover:bg-forest hover:text-cream disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-forest"><FiChevronLeft aria-hidden /></button>
          <Picker view={view} setView={setView} data={data} />
          <button type="button" aria-label="Next" disabled={!next} onClick={() => next && setView(next)} className="grid h-11 w-11 place-items-center rounded-full border-2 border-forest text-forest transition hover:bg-forest hover:text-cream disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-forest"><FiChevronRight aria-hidden /></button>
        </div>
      </div>

      {isError && <p role="alert" className="mt-4 text-sm text-strawberry">Could not load the sales chart. Please log in again if your session has expired.</p>}
      {!data && !isError && <div className="mt-5 h-72 animate-pulse rounded-2xl bg-vanilla" />}

      {data && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl bg-vanilla/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Total received</p>
              <p className="font-display text-xl font-extrabold text-forest sm:text-2xl">{formatPKR(data.total)}</p>
              <Change pct={data.change_percent} total={data.total} prev={data.previous_total} label={prevLabel} />
            </div>
            <div className="rounded-2xl bg-vanilla/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Completed orders</p>
              <p className="font-display text-xl font-extrabold text-forest sm:text-2xl">{data.orders}</p>
            </div>
            <div className="rounded-2xl bg-vanilla/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Average order</p>
              <p className="font-display text-xl font-extrabold text-forest sm:text-2xl">{formatPKR(data.average_order)}</p>
            </div>
            <div className="rounded-2xl bg-mango/25 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">{data.mode === "year" ? "Best month" : data.mode === "day" ? "Busiest hour" : "Best day"}</p>
              <p className="font-display text-xl font-extrabold text-forest sm:text-2xl">{data.best ? formatPKR(data.best.total) : "—"}</p>
              {data.best && <p className="text-xs text-ink/70">{fullLabel(data.best.key, data.mode)}</p>}
            </div>
          </div>

          <div className={`mt-6 grid grid-cols-[2.75rem_1fr] gap-x-2 transition-opacity ${isFetching ? "opacity-70" : ""}`}>
            <div className="relative h-64" aria-hidden>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="absolute right-0 -translate-y-1/2 text-[11px] font-semibold text-ink/55" style={{ bottom: `${(i / 5) * 100}%` }}>{compact((top * i) / 5)}</span>
              ))}
            </div>
            <div className="relative h-64">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`absolute inset-x-0 border-t ${i === 0 ? "border-vanilla-deep" : "border-dashed border-vanilla-deep/60"}`} style={{ bottom: `${(i / 5) * 100}%` }} />
              ))}

              <div className="absolute inset-0 flex items-end gap-[2px] sm:gap-1" onMouseLeave={() => setHover(null)}>
                {points.map((p, i) => {
                  const h = p.future ? 0 : Math.max(p.total > 0 ? 3 : 0, (p.total / top) * 100);
                  const isBest = p.key === best;
                  const on = active === i;
                  return (
                    <button
                      key={p.key} type="button" disabled={p.future}
                      className="group relative flex h-full flex-1 items-end rounded-t-md outline-none focus-visible:ring-2 focus-visible:ring-forest disabled:cursor-default"
                      onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                      onClick={() => setPinned((v) => (v === i ? null : i))}
                      aria-label={`${fullLabel(p.key, data.mode)}: ${formatPKR(p.total)}, ${p.orders} orders`}
                    >
                      {on && <span className="absolute inset-0 rounded-t-md bg-forest/[0.06]" />}
                      {!p.future && p.total === 0 && <span className="relative mx-auto h-[3px] w-full rounded-full bg-vanilla-deep/70" />}
                      {p.total > 0 && (
                        <motion.span
                          className={`relative block w-full rounded-t-md bg-gradient-to-t shadow-sm ${isBest ? "from-mango to-[#FFE08A]" : "from-forest-700 to-mint-deep"} ${on ? "brightness-110" : ""}`}
                          initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ type: "spring", stiffness: 140, damping: 20, delay: Math.min(i * 0.012, 0.35) }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {active !== null && points[active] && !points[active].future && (
                  <motion.div
                    key="tip" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                    className="pointer-events-none absolute -top-2 z-10 w-max max-w-[14rem] rounded-2xl bg-forest px-3 py-2 text-cream shadow-lift"
                    style={{ left: `${((active + 0.5) / n) * 100}%`, transform: `translate(-${n > 1 ? (active / (n - 1)) * 100 : 50}%, -100%)` }}
                    role="status"
                  >
                    <p className="text-xs text-cream/75">{fullLabel(points[active].key, data.mode)}</p>
                    <p className="font-display text-base font-extrabold">{formatPKR(points[active].total)}</p>
                    <p className="text-xs text-cream/75">{points[active].orders} {points[active].orders === 1 ? "order" : "orders"}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {data.total === 0 && (
                <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                  <p className="max-w-xs rounded-2xl bg-white/90 px-4 py-3 text-sm text-ink/70 shadow-card">No completed sales in this period yet. Orders appear here the moment you mark them completed.</p>
                </div>
              )}
            </div>

            <div />
            <div className="mt-2 flex gap-[2px] sm:gap-1" aria-hidden>
              {points.map((p, i) => {
                const show = i % step === 0 || active === i;
                const wd = data.mode === "days" ? dayOf(p.key).toLocaleDateString("en-GB", { weekday: "short" }) : null;
                return (
                  <span key={p.key} className={`flex-1 text-center text-[10px] leading-tight sm:text-xs ${active === i ? "font-extrabold text-forest" : p.key === data.today ? "font-extrabold text-strawberry" : "text-ink/60"} ${p.future ? "opacity-40" : ""}`}>
                    {show ? <>{wd && <span className="block">{wd}</span>}{p.label}</> : ""}
                  </span>
                );
              })}
            </div>
          </div>

          {/* tap a bar to pin it, then jump straight into that day / month */}
          {pinnedPoint && data.mode !== "day" && !pinnedPoint.future && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-vanilla/70 px-4 py-2.5 text-sm">
              <p><strong>{fullLabel(pinnedPoint.key, data.mode)}</strong>: {formatPKR(pinnedPoint.total)} · {pinnedPoint.orders} {pinnedPoint.orders === 1 ? "order" : "orders"}</p>
              <button type="button" className="font-bold text-forest underline" onClick={() => setView(data.mode === "year" ? { kind: "month", year: data.year, month: Number(pinnedPoint.key.slice(5, 7)) } : { kind: "day", date: pinnedPoint.key })}>
                {data.mode === "year" ? "View this month →" : "View this day →"}
              </button>
            </div>
          )}

          {data.mode === "day" && <DayOrders data={data} />}

          <p className="mt-3 text-xs text-ink/55">Amounts in Rs. Only completed orders count as received money, shown at the time you mark them completed (Pakistan time). Tap a bar for details.</p>
        </>
      )}
    </section>
  );
}

function DayOrders({ data }: { data: SalesReport }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-base">Orders completed this day ({data.orders_list.length})</h3>
      {data.orders_list.length === 0 ? (
        <p className="rounded-2xl bg-vanilla/60 px-4 py-3 text-sm text-ink/70">No orders were completed on this day.</p>
      ) : (
        <ul className="max-h-80 divide-y divide-vanilla-deep/60 overflow-y-auto rounded-2xl border border-vanilla-deep/70">
          {data.orders_list.map((o) => (
            <li key={o.order_number} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
              <span className="w-12 font-bold tabular-nums text-forest">{o.time}</span>
              <span className="font-mono text-xs text-ink/70">{o.order_number}</span>
              <span className="min-w-0 flex-1 basis-40 truncate" title={o.items}>{o.customer}{o.items ? <span className="text-ink/55"> · {o.items}</span> : null}</span>
              {o.method && <span className="chip py-0.5 text-xs">{o.method === "EASYPAISA" ? "Easypaisa" : "Cash"}</span>}
              <strong className="tabular-nums text-forest">{formatPKR(o.total)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Change({ pct, total, prev, label }: { pct: number | null; total: number; prev: number; label: string }) {
  if (pct === null) return <p className="text-xs text-ink/60">{total > 0 && prev === 0 ? `Nothing in ${label}` : `No sales in ${label}`}</p>;
  const up = pct >= 0;
  const Icon = up ? FiTrendingUp : FiTrendingDown;
  return (
    <p className={`flex items-center gap-1 text-xs font-bold ${up ? "text-forest-700" : "text-strawberry"}`}>
      <Icon aria-hidden />{up ? "+" : ""}{pct}% <span className="font-normal text-ink/60">vs {label}</span>
    </p>
  );
}

/** The calendar. Step 1: pick a year and a month. Step 2: the month opens as a real calendar, pick a day (days with sales are shaded). */
function Picker({ view, setView, data }: { view: View; setView: (v: View) => void; data: SalesReport | undefined }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"months" | "days">("months");
  const ref = useRef<HTMLDivElement>(null);
  const cur = data?.current ?? { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  const first = data?.first_sale ?? cur; // before the first sale there is nothing to look at
  const today = data?.today ?? keyOf(new Date());
  const selYear = view.kind === "days" ? cur.year : view.kind === "day" ? Number(view.date.slice(0, 4)) : view.year;
  const [year, setYear] = useState(selYear);
  const [cal, setCal] = useState({ year: cur.year, month: cur.month }); // the month shown in the day calendar

  // The calendar's own query, so it always has the month's per-day totals whatever the chart behind it shows.
  const { data: monthData } = useAdminSalesQuery({ year: cal.year, month: cal.month }, { skip: !open || stage !== "days" });

  useEffect(() => {
    if (!open) return;
    setYear(selYear);
    setStage(view.kind === "month" || view.kind === "day" ? "days" : "months"); // reopen on the month you are looking at
    setCal(view.kind === "month" ? { year: view.year, month: view.month } : view.kind === "day" ? { year: Number(view.date.slice(0, 4)), month: Number(view.date.slice(5, 7)) } : { year: cur.year, month: cur.month });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);

  const monthOk = (y: number, m: number) => y * 12 + m >= first.year * 12 + first.month && y * 12 + m <= cur.year * 12 + cur.month;
  const pick = (v: View) => { setView(v); setOpen(false); };
  const label = view.kind === "days" ? `Last ${view.days} days` : view.kind === "year" ? `Year ${view.year}` : view.kind === "day" ? dayOf(view.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : `${SHORT[view.month - 1]} ${view.year}`;

  // the day calendar
  const days = monthData && monthData.mode === "month" && monthData.year === cal.year && monthData.month === cal.month ? monthData.points : null;
  const maxDay = Math.max(1, ...(days ?? []).map((d) => d.total));
  const lead = (new Date(cal.year, cal.month - 1, 1).getDay() + 6) % 7; // Monday first
  const calIdx = cal.year * 12 + cal.month - 1;
  const canPrevMonth = calIdx > first.year * 12 + first.month - 1, canNextMonth = calIdx < cur.year * 12 + cur.month - 1;
  const moveMonth = (dir: -1 | 1) => { const i = calIdx + dir; setCal({ year: Math.floor(i / 12), month: (i % 12) + 1 }); };

  return (
    <div className="sm:relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open} className="btn-secondary min-h-[44px] gap-2 px-4">
        <FiCalendar aria-hidden />{label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog" aria-label="Choose a month or a day"
            initial={{ opacity: 0, scale: 0.96, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.14 }}
            className="absolute inset-x-3 z-30 mt-2 origin-top rounded-card sm:inset-x-auto sm:right-0 sm:w-80 sm:origin-top-right bg-white p-4 shadow-lift ring-1 ring-vanilla-deep"
          >
            {stage === "months" ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <button type="button" className="rounded-full p-2 hover:bg-vanilla disabled:opacity-30" disabled={year <= first.year} onClick={() => setYear((y) => y - 1)} aria-label="Previous year"><FiChevronLeft /></button>
                  <p className="font-display text-lg font-extrabold text-forest">{year}</p>
                  <button type="button" className="rounded-full p-2 hover:bg-vanilla disabled:opacity-30" disabled={year >= cur.year} onClick={() => setYear((y) => y + 1)} aria-label="Next year"><FiChevronRight /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SHORT.map((m, i) => {
                    const ok = monthOk(year, i + 1);
                    const sel = (view.kind === "month" && view.year === year && view.month === i + 1) || (view.kind === "day" && view.date.startsWith(`${year}-${pad(i + 1)}`));
                    return (
                      <button key={m} type="button" disabled={!ok} onClick={() => { setView({ kind: "month", year, month: i + 1 }); setCal({ year, month: i + 1 }); setStage("days"); }}
                        className={`min-h-[40px] rounded-xl text-sm font-bold transition ${sel ? "bg-forest text-cream" : ok ? "bg-vanilla text-forest hover:bg-mango/40" : "cursor-not-allowed text-ink/25"}`}>
                        {m}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 grid gap-2 border-t border-vanilla-deep pt-3">
                  <button type="button" className={`min-h-[40px] rounded-xl text-sm font-bold ${view.kind === "year" && view.year === year ? "bg-forest text-cream" : "bg-mint/40 text-forest hover:bg-mint"}`} onClick={() => pick({ kind: "year", year })}>
                    Whole year {year}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="min-h-[40px] rounded-xl bg-vanilla text-sm font-bold text-forest hover:bg-mango/40" onClick={() => pick({ kind: "days", days: 7 })}>Last 7 days</button>
                    <button type="button" className="min-h-[40px] rounded-xl bg-vanilla text-sm font-bold text-forest hover:bg-mango/40" onClick={() => pick({ kind: "day", date: today })}>Today</button>
                  </div>
                </div>
                {data?.first_sale && <p className="mt-3 text-center text-xs text-ink/55">First sale: {SHORT[data.first_sale.month - 1]} {data.first_sale.year}. Pick a month to choose a day.</p>}
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <button type="button" className="rounded-full p-2 hover:bg-vanilla disabled:opacity-30" disabled={!canPrevMonth} onClick={() => moveMonth(-1)} aria-label="Previous month"><FiChevronLeft /></button>
                  <button type="button" className="font-display text-lg font-extrabold text-forest hover:underline" onClick={() => { setYear(cal.year); setStage("months"); }} aria-label="Back to the month list">{MONTHS[cal.month - 1]} {cal.year}</button>
                  <button type="button" className="rounded-full p-2 hover:bg-vanilla disabled:opacity-30" disabled={!canNextMonth} onClick={() => moveMonth(1)} aria-label="Next month"><FiChevronRight /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {WEEK.map((w) => <span key={w} className="pb-1 text-[11px] font-bold uppercase text-ink/50">{w.slice(0, 2)}</span>)}
                  {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
                  {(days ?? Array.from({ length: new Date(cal.year, cal.month, 0).getDate() }, (_, i) => ({ key: `${cal.year}-${pad(cal.month)}-${pad(i + 1)}`, label: String(i + 1), total: 0, orders: 0, future: false }))).map((d) => {
                    const sel = view.kind === "day" && view.date === d.key;
                    const disabled = d.key > today;
                    const shade = d.total > 0 ? 0.22 + 0.6 * (d.total / maxDay) : 0;
                    return (
                      <button key={d.key} type="button" disabled={disabled} onClick={() => pick({ kind: "day", date: d.key })}
                        title={d.total > 0 ? `${formatPKR(d.total)} · ${d.orders} orders` : undefined}
                        className={`relative aspect-square rounded-lg text-sm font-bold transition ${sel ? "bg-forest text-cream" : disabled ? "cursor-not-allowed text-ink/25" : "text-forest hover:ring-2 hover:ring-mango"} ${d.key === today && !sel ? "ring-2 ring-strawberry/60" : ""}`}
                        style={!sel && shade ? { background: `rgba(108,203,166,${shade})` } : !sel && !disabled ? { background: "#F2E8D9" } : undefined}>
                        {d.label}
                      </button>
                    );
                  })}
                </div>
                {!days && <p className="mt-2 text-center text-xs text-ink/55">Loading…</p>}
                <p className="mt-2 text-center text-xs text-ink/55">Green days have sales: the darker, the more. Tap a day to see its orders.</p>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-vanilla-deep pt-3">
                  <button type="button" className="min-h-[40px] rounded-xl bg-mint/40 text-sm font-bold text-forest hover:bg-mint" onClick={() => pick({ kind: "month", year: cal.year, month: cal.month })}>Whole month</button>
                  <button type="button" className="min-h-[40px] rounded-xl bg-vanilla text-sm font-bold text-forest hover:bg-mango/40" onClick={() => { setYear(cal.year); setStage("months"); }}>All months</button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}