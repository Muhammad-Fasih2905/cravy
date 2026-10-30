/** Tells every open tab of this browser that the menu changed (admin saved something), so they refresh at once. */
const CHANNEL = "cravy-menu";

export function announceMenuChange(): void {
    try {
        if (typeof BroadcastChannel === "undefined") return;
        const c = new BroadcastChannel(CHANNEL); c.postMessage("changed"); c.close();
    } catch { /* the 5-second refresh still picks it up */ }
}

export function onMenuChange(cb: () => void): () => void {
    if (typeof BroadcastChannel === "undefined") return () => { };
    const c = new BroadcastChannel(CHANNEL);
    c.onmessage = () => cb();
    return () => c.close();
}

/** How often an open, visible page asks the server for the latest menu. */
export const MENU_POLL_MS = 5000;