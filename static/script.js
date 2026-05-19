function toggleNavBar() {
    var x = document.querySelector(".nav-links");
    x.classList.toggle("responsive");
}

document.addEventListener("DOMContentLoaded", function () {
    const dropdowns = document.querySelectorAll('.dropdown-box');
    const selections = document.querySelectorAll('.selection');
    const selectedCharacter = [
        document.querySelector('.selected-character-pfp'),
        document.querySelector('.name-arc-character').querySelector('textPath'),
        0
    ]
    const selectedVehicle = [
        document.querySelector('.selected-vehicle-pfp'),
        document.querySelector('.name-arc-vehicle').querySelector('textPath'),
        0
    ]

    dropdowns.forEach(function (dropdown) {
        dropdown.addEventListener('click', function (e) {
            if (e.target.closest('.dropdown-title') || e.target === dropdown) {
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

    selections.forEach(function (selection) {
        const image = selection.querySelector('.selection-pfp');
        const name = selection.querySelector('textPath');
        const isCharacter = selection.closest('#character-dropdown');
        const isVehicle = selection.closest('#vehicle-dropdown');
        const hiddenid = selection.dataset.hiddenid
        selection.addEventListener('click', function (e) {
            if (isCharacter && selectedCharacter[2] != hiddenid) {
                selectedCharacter[0].src = image.src
                selectedCharacter[0].alt = image.alt
                selectedCharacter[1].textContent = name.textContent
                selectedCharacter[2] = hiddenid
            } else if (isVehicle && selectedVehicle[2] != hiddenid) {
                selectedVehicle[0].src = image.src
                selectedVehicle[0].alt = image.alt
                selectedVehicle[1].textContent = name.textContent
                selectedVehicle[2] = hiddenid
            }
        })
    })
});
