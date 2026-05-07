function toggleNavBar() {
    var x = document.querySelector(".nav-links");
    x.classList.toggle("responsive");
}

document.addEventListener("DOMContentLoaded", function() {
    document.querySelector(".icon").addEventListener("click", toggleNavBar);
});