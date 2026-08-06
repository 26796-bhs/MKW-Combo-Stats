const BETA_NAV_FLAG_KEY = "mkw-flag-beta-nav-bar";

export function applyBetaNavBar(enabled) {
    document.documentElement.classList.toggle("beta-nav-bar", !!enabled);
    try {
        localStorage.setItem(BETA_NAV_FLAG_KEY, enabled ? "1" : "0");
    } catch (e) { }
}

export function isBetaNavBarEnabled() {
    try {
        return localStorage.getItem(BETA_NAV_FLAG_KEY) === "1";
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
