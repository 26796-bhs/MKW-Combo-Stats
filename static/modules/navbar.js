const LEGACY_NAV_FLAG_KEY = "mkw-flag-legacy-nav-bar";

export function applyLegacyNavBar(enabled) {
    document.documentElement.classList.toggle("legacy-nav-bar", !!enabled);
    try {
        localStorage.setItem(LEGACY_NAV_FLAG_KEY, enabled ? "1" : "0");
    } catch (e) { }
}

export function isLegacyNavBarEnabled() {
    try {
        return localStorage.getItem(LEGACY_NAV_FLAG_KEY) === "1";
    } catch (e) {
        return false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const icon = document.querySelector(".nav-bar .icon");
    const links = document.querySelector(".nav-links");
    if (!icon || !links) return;

    icon.addEventListener("click", (e) => {
        e.preventDefault();
        links.classList.toggle("responsive");
    });
});
