"use client";
import { toast } from "react-toastify";

/**
 * All pop-up messages in the app go through here, so the browser's own alert() / confirm() boxes are never used.
 *   notify.success("Saved")   notify.error("Could not save")   notify.info("...")
 *   if (await confirmToast("Delete this?", { danger: true })) { ... }
 */
export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
};

type ConfirmOptions = { confirmLabel?: string; cancelLabel?: string; danger?: boolean };

/** A question shown as a toast with two buttons. Resolves true on confirm, false on cancel or when it is dismissed. */
export function confirmToast(message: string, { confirmLabel = "Yes", cancelLabel = "No", danger = false }: ConfirmOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const id = `confirm:${message}`;
    if (toast.isActive(id)) return resolve(false); // the same question is already on screen
    let settled = false;
    const finish = (answer: boolean) => { if (!settled) { settled = true; resolve(answer); } };
    toast(
      ({ closeToast }) => (
        <div role="alertdialog" aria-label={message} className="space-y-3">
          <p className="whitespace-pre-line text-sm font-semibold leading-snug">{message}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" autoFocus onClick={() => { finish(true); closeToast(); }}
              className={`min-h-[44px] rounded-full px-5 text-sm font-bold text-white ${danger ? "bg-strawberry" : "bg-forest"}`}>{confirmLabel}</button>
            <button type="button" onClick={() => { finish(false); closeToast(); }}
              className="min-h-[44px] rounded-full border-2 border-vanilla-deep px-5 text-sm font-bold text-forest">{cancelLabel}</button>
          </div>
        </div>
      ),
      { toastId: id, position: "top-center", autoClose: false, closeOnClick: false, closeButton: false, draggable: false, onClose: () => finish(false) },
    );
  });
}