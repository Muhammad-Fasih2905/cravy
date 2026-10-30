import { PUBLIC_API } from "@/lib/config";
import { notify } from "./notify";

const token = () => sessionStorage.getItem("cravy-admin") ?? "";
const authHeader = () => ({ authorization: `Bearer ${token()}` });

/** Opens a protected page or file (slip, receipt) in a new tab. The admin token travels in a header, never in the address. */
async function openProtected(path: string): Promise<void> {
  const tab = window.open("", "_blank"); // opened inside the click, so pop-up blockers allow it
  try {
    const r = await fetch(`${PUBLIC_API}${path}`, { headers: authHeader(), cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    const url = URL.createObjectURL(await r.blob()); // keeps the server's content type (html, image or pdf)
    if (tab) tab.location.href = url; else window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
  } catch {
    tab?.close();
    notify.error("Could not open it. Your session may have expired, please log in again.");
  }
}

/** The printable order slip (80 mm thermal friendly). The page prints itself as soon as it opens. */
export const printSlip = (orderNumber: string) => openProtected(`/api/admin/orders/${encodeURIComponent(orderNumber)}/slip?autoprint=1`);
export const openReceipt = (orderNumber: string) => openProtected(`/api/admin/orders/${encodeURIComponent(orderNumber)}/receipt`);

/** URL for the live order stream. EventSource cannot send headers, so the server accepts ?token= for this one route. */
export const streamUrl = () => `${PUBLIC_API}/api/admin/orders/stream?token=${encodeURIComponent(token())}`;