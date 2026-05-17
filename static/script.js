function toggleNavBar() {
    var x = document.querySelector(".nav-links");
    x.classList.toggle("responsive");
}

document.addEventListener("DOMContentLoaded", function () {
    const icon = document.querySelector(".icon");
    if (icon) icon.addEventListener("click", toggleNavBar);

    const dropdowns = document.querySelectorAll('.dropdown-box');
    dropdowns.forEach(function (dropdown) {
        dropdown.addEventListener('click', function (e) {
            // Check if the click was on the title or the dropdown container itself
            if (e.target.closest('.dropdown-title') || e.target === dropdown) {
                // Use .toggle() to cleanly switch the classes
                const isCollapsed = dropdown.classList.contains('dropdown-collapsed');

                if (isCollapsed) {
                    dropdown.classList.remove('dropdown-collapsed');
                    dropdown.classList.add('dropdown-expanded');
                } else {
                    dropdown.classList.remove('dropdown-expanded');
                    dropdown.classList.add('dropdown-collapsed');
                }
            }
        });
    });
});
