import { getDeviceKey } from "./device-key.js";

const origin = window.location.origin;

/** Fetch combo stats calculated on the Flask server. */
export async function get_combo(id_one, id_two) {
    if (id_one == null || id_two == null || id_one === "" || id_two === "") {
        return [0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    const res = await fetch(`${origin}/combo/${id_one}/${id_two}`);
    if (!res.ok) return [0, 0, 0, 0, 0, 0, 0, 0, 0];
    return res.json();
}

export async function get_character(id) {
    return fetch(`${origin}/characters/${id}`).then((res) => res.json());
}

export async function get_vehicle(id) {
    return fetch(`${origin}/vehicles/${id}`).then((res) => res.json());
}

export async function get_best_combo(mapId, priority) {
    const body = new URLSearchParams();
    body.set("map", String(mapId));
    body.set("priority", priority);
    const res = await fetch(`${origin}/api/selection/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
    if (!res.ok) throw new Error("Failed to fetch best combo");
    return res.json();
}

export async function get_upvotes(characterId, vehicleId) {
    const device = await getDeviceKey();
    const res = await fetch(
        `${origin}/upvotes/${characterId}/${vehicleId}?device=${encodeURIComponent(device)}`
    );
    if (!res.ok) return { upvotes: 0, voted: false };
    const data = await res.json();
    return {
        upvotes: data.upvotes ?? 0,
        voted: Boolean(data.voted),
    };
}

export async function upvote_combo(characterId, vehicleId) {
    const device = await getDeviceKey();
    const body = new URLSearchParams();
    body.set("character", String(characterId));
    body.set("vehicle", String(vehicleId));
    body.set("device", device);
    const res = await fetch(`${origin}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
    if (!res.ok) throw new Error("Failed to upvote");
    const data = await res.json();
    return {
        upvotes: data.upvotes ?? 0,
        voted: Boolean(data.voted),
    };
}

export async function downvote_combo(characterId, vehicleId) {
    const device = await getDeviceKey();
    const body = new URLSearchParams();
    body.set("character", String(characterId));
    body.set("vehicle", String(vehicleId));
    body.set("device", device);
    const res = await fetch(`${origin}/downvote`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
    if (!res.ok) throw new Error("Failed to downvote");
    const data = await res.json();
    return {
        upvotes: data.upvotes ?? 0,
        voted: Boolean(data.voted),
    };
}
