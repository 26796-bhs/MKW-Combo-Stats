import { get_combo } from "../modules/communication-service.js";

function toggleNavBar() {
    var x = document.querySelector(".nav-links");
    x.classList.toggle("responsive");
}
function updateStatsBar(sectionName, statName, floatValue) {
    const percentageString = `${floatValue * 100}%`
    const sections = document.querySelectorAll('.sections .section');

    sections.forEach(section => {
        const sectionTitle = section.querySelector('.section-title')

        if (sectionTitle && sectionTitle.textContent.trim().toUpperCase() === sectionName.toUpperCase()) {
            const statRows = section.querySelectorAll('[class^="section-stats-"]')
            statRows.forEach(row => {
                const subsectionTitle = row.querySelector('.stats-title');
                if (subsectionTitle && subsectionTitle.textContent.trim().toLowerCase() === statName.toLowerCase()) {
                    const progressValueEl = row.querySelector('.stats-progress-value');
                    if (progressValueEl) {
                        progressValueEl.style.setProperty('--value', percentageString)
                    }
                }
            });
        }
    });
}


document.addEventListener("DOMContentLoaded", function () {
    const dropdowns = document.querySelectorAll('.dropdown-box');
    const selections = document.querySelectorAll('.selection');
    const selectedCharacter = [
        document.querySelector('.selected-character-pfp'),
        document.querySelector('.name-arc-character').querySelector('textPath'),
        '0'
    ]
    const selectedVehicle = [
        document.querySelector('.selected-vehicle-pfp'),
        document.querySelector('.name-arc-vehicle').querySelector('textPath'),
        '0'
    ]

    dropdowns.forEach(function (dropdown) {
        const contentBox = dropdown.querySelector('.dropdown-contentbox');
        if (contentBox) {
            contentBox.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }

        dropdown.addEventListener('click', function (e) {
            // Only toggle when clicking the top 50px of the dropdown
            if (e.offsetY <= 50) {
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


    async function updateStats() {
        const data = await get_combo(selectedCharacter[2], selectedVehicle[2])
        console.log(selectedCharacter[2], selectedVehicle[2], data)
        updateStatsBar("SPEED", "On Road", data[0])
        updateStatsBar("SPEED", "Off Road", data[1])
        updateStatsBar("SPEED", "In Water", data[2])
        updateStatsBar("HANDLING", "On Road", data[3])
        updateStatsBar("HANDLING", "Off Road", data[4])
        updateStatsBar("HANDLING", "In Water", data[5])
        updateStatsBar("OTHER", "Accel", data[6])
        updateStatsBar("OTHER", "Turbo", data[7])
        updateStatsBar("OTHER", "Weight", data[8])
    }

    selections.forEach(function (selection) {
        const image = selection.querySelector('.selection-pfp');
        const name = selection.querySelector('textPath');
        const isCharacter = selection.closest('#character-dropdown');
        const isVehicle = selection.closest('#vehicle-dropdown');
        const hiddenid = selection.dataset.hiddenid
        selection.addEventListener('click', async function (e) {
            if (isCharacter && selectedCharacter[2] != hiddenid) {
                selectedCharacter[0].style.setProperty('--imgurl', image.style.getPropertyValue('--bg-image').trim());
                selectedCharacter[1].textContent = name.textContent
                selectedCharacter[2] = hiddenid
                await updateStats()
            } else if (isVehicle && selectedVehicle[2] != hiddenid) {
                selectedVehicle[0].style.setProperty('--imgurl', image.style.getPropertyValue('--bg-image').trim());
                selectedVehicle[1].textContent = name.textContent
                selectedVehicle[2] = hiddenid
                await updateStats()
            }
        })
    })

    updateStats()
});