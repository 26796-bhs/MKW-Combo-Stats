/**
 * Stable-ish device key for one-vote-per-device.
 * Combines a localStorage UUID with a lightweight browser/hardware fingerprint
 * (canvas + screen + UA). Not true HWID — browsers don't expose that — but
 * enough to stop casual upvote spam on the same device/browser.
 */
const STORAGE_KEY = "mkw_device_key_v1";

function canvasFingerprint() {
    try {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 40;
        const ctx = canvas.getContext("2d");
        if (!ctx) return "no-canvas";
        ctx.textBaseline = "top";
        ctx.font = "14px 'Segoe UI', Arial";
        ctx.fillStyle = "#f60";
        ctx.fillRect(0, 0, 200, 40);
        ctx.fillStyle = "#069";
        ctx.fillText("MKW-combo-fp", 4, 12);
        ctx.strokeStyle = "#ff0";
        ctx.beginPath();
        ctx.arc(100, 20, 12, 0, Math.PI * 2);
        ctx.stroke();
        return canvas.toDataURL();
    } catch (_) {
        return "canvas-error";
    }
}

function rawFingerprint() {
    const nav = navigator || {};
    const scr = window.screen || {};
    return [
        nav.userAgent || "",
        nav.language || "",
        nav.platform || "",
        nav.hardwareConcurrency || "",
        nav.deviceMemory || "",
        nav.maxTouchPoints || "",
        scr.width || "",
        scr.height || "",
        scr.colorDepth || "",
        window.devicePixelRatio || "",
        Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        canvasFingerprint(),
    ].join("||");
}

async function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    if (window.crypto?.subtle) {
        const digest = await window.crypto.subtle.digest("SHA-256", data);
        return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    // Fallback hash if SubtleCrypto is unavailable (e.g. insecure context).
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return `f${(h >>> 0).toString(16)}`;
}

function ensureLocalId() {
    try {
        let id = localStorage.getItem(STORAGE_KEY);
        if (!id) {
            id = (window.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random()}`);
            localStorage.setItem(STORAGE_KEY, id);
        }
        return id;
    } catch (_) {
        return `session-${Date.now()}`;
    }
}

let cachedKey = null;

export async function getDeviceKey() {
    if (cachedKey) return cachedKey;
    const localId = ensureLocalId();
    const fp = rawFingerprint();
    cachedKey = await sha256Hex(`${localId}::${fp}`);
    return cachedKey;
}
