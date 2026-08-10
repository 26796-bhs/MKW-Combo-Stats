import { applyLegacyNavBar, isLegacyNavBarEnabled } from "../modules/navbar.js";

document.addEventListener("DOMContentLoaded", () => {
    const checkbox = document.getElementById("legacy-nav-bar");
    if (!checkbox) return;

    checkbox.checked = isLegacyNavBarEnabled();

    checkbox.addEventListener("change", () => {
        applyLegacyNavBar(checkbox.checked);
    });
});
