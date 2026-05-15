function toggleNavBar() {
    var x = document.querySelector(".nav-links");
    x.classList.toggle("responsive");
}

document.addEventListener("DOMContentLoaded", function () {
    const icon = document.querySelector(".icon");
    if (icon) icon.addEventListener("click", toggleNavBar);

    // Toggle dropdown expand/collapse on click
    const dropdown = document.querySelector('.dropdown-box');
    if (dropdown) {
        dropdown.addEventListener('click', function (e) {
            // Toggle only on clicks to the header area or the container itself
            if (e.target.closest('.dropdown-title') || e.target === dropdown) {
                if (dropdown.classList.contains('dropdown-collapsed')) {
                    dropdown.classList.remove('dropdown-collapsed');
                    dropdown.classList.add('dropdown-expanded');
                } else {
                    dropdown.classList.remove('dropdown-expanded');
                    dropdown.classList.add('dropdown-collapsed');
                }
            }
        });
    }
});