import { applyBetaNavBar, isBetaNavBarEnabled } from "../modules/navbar.js";

document.addEventListener("DOMContentLoaded", () => {
    const checkbox = document.getElementById("beta-nav-bar");
    if (!checkbox) return;

    checkbox.checked = isBetaNavBarEnabled();

    checkbox.addEventListener("change", () => {
        applyBetaNavBar(checkbox.checked);
    });
});
