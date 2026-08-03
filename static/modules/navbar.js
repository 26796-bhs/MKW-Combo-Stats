document.addEventListener("DOMContentLoaded", () => {
    const icon = document.querySelector(".nav-bar .icon");
    const links = document.querySelector(".nav-links");
    if (!icon || !links) return;

    icon.addEventListener("click", (e) => {
        e.preventDefault();
        links.classList.toggle("responsive");
    });
});
