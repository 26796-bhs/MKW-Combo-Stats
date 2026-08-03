import { get_combo } from "../modules/communication-service.js";
import { preloadUrlsFromJsonElement } from "../modules/preload-images.js";

const MAX_PANELS = 3;

const statsValues = {};

function updateStatsBar(root, sectionName, statName, floatValue) {
    const percentageString = `${floatValue * 100}%`;
    const key = `${sectionName}-${statName}`;
    if (!statsValues[key]) {
        statsValues[key] = [];
    }

    root.querySelectorAll(".sections .section").forEach((section) => {
        const sectionTitle = section.querySelector(".section-title");
        if (sectionTitle && sectionTitle.textContent.trim().toUpperCase() === sectionName.toUpperCase()) {
            section.querySelectorAll('[class^="section-stats-"]').forEach((row) => {
                const subsectionTitle = row.querySelector(".stats-title");
                if (subsectionTitle && subsectionTitle.textContent.trim().toLowerCase() === statName.toLowerCase()) {
                    const progressValueElement = row.querySelector(".stats-progress-value");
                    if (progressValueElement) {
                        statsValues[key] = statsValues[key].filter((entry) => entry.element !== progressValueElement);
                        statsValues[key].push({
                            value: floatValue,
                            element: progressValueElement,
                        });
                        progressValueElement.style.setProperty("--value", percentageString);
                        progressValueElement.classList.remove("min-value", "max-value");
                    }
                }
            });
        }
    });
}

function pruneStatsValues() {
    for (const key of Object.keys(statsValues)) {
        statsValues[key] = statsValues[key].filter((entry) => entry.element.isConnected);
        if (statsValues[key].length === 0) {
            delete statsValues[key];
        }
    }
}

function applyMinMaxHighlighting() {
    document.querySelectorAll(".stats-progress-value").forEach((el) => {
        el.classList.remove("min-value", "max-value");
    });

    for (const values of Object.values(statsValues)) {
        if (values.length < 2) continue;

        let minValue = values[0].value;
        let maxValue = values[0].value;
        let minElement = values[0].element;
        let maxElement = values[0].element;

        for (let i = 1; i < values.length; i++) {
            if (values[i].value < minValue) {
                minValue = values[i].value;
                minElement = values[i].element;
            }
            if (values[i].value > maxValue) {
                maxValue = values[i].value;
                maxElement = values[i].element;
            }
        }

        if (minValue === maxValue) continue;
        if (minElement) minElement.classList.add("min-value");
        if (maxElement) maxElement.classList.add("max-value");
    }
}

async function applyComboStats(cardRoot, characterId, vehicleId) {
    const data = await get_combo(characterId, vehicleId);
    updateStatsBar(cardRoot, "SPEED", "On Road", data[0]);
    updateStatsBar(cardRoot, "SPEED", "Off Road", data[1]);
    updateStatsBar(cardRoot, "SPEED", "In Water", data[2]);
    updateStatsBar(cardRoot, "HANDLING", "On Road", data[3]);
    updateStatsBar(cardRoot, "HANDLING", "Off Road", data[4]);
    updateStatsBar(cardRoot, "HANDLING", "In Water", data[5]);
    updateStatsBar(cardRoot, "OTHER", "Accel", data[6]);
    updateStatsBar(cardRoot, "OTHER", "Turbo", data[7]);
    updateStatsBar(cardRoot, "OTHER", "Weight", data[8]);
    applyMinMaxHighlighting();
}

function cloneTemplate(id) {
    return document.getElementById(id).content.cloneNode(true);
}

function updateGridLayout(grid) {
    const count = grid.children.length;
    grid.classList.remove("panels-1", "panels-2", "panels-3");
    grid.classList.add(`panels-${Math.min(Math.max(count, 1), 3)}`);
}

function countStatsPanels(grid) {
    return grid.querySelectorAll(".comparebox.stats").length;
}

function countOccupiedPanels(grid) {
    return grid.querySelectorAll(".comparebox.stats, .comparebox.choosing").length;
}

function hasAddPanel(grid) {
    return grid.querySelector(".comparebox.add") !== null;
}

function ensureAddPanel(grid) {
    const occupied = countOccupiedPanels(grid);
    if (occupied >= MAX_PANELS) {
        grid.querySelectorAll(".comparebox.add").forEach((panel) => panel.remove());
        return;
    }
    if (!hasAddPanel(grid)) {
        grid.appendChild(createAddPanel());
    }
}

function removePanel(panel) {
    const grid = panel.closest("#compare-grid");
    panel.remove();
    pruneStatsValues();
    applyMinMaxHighlighting();
    ensureAddPanel(grid);
    if (grid.children.length === 0) {
        grid.appendChild(createAddPanel());
    }
    updateGridLayout(grid);
}

function createAddPanel() {
    const panel = document.createElement("div");
    panel.className = "comparebox add";
    panel.innerHTML = `
        <button type="button" class="add-compare-btn" aria-label="Add comparison">
            <svg class="add-compare-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
        </button>
    `;
    panel.querySelector(".add-compare-btn").addEventListener("click", () => onAddClick(panel));
    return panel;
}

function createChoosingPanel() {
    const panel = document.createElement("div");
    panel.className = "comparebox choosing";

    const charDropdown = cloneTemplate("character-dropdown-template");
    const vehDropdown = cloneTemplate("vehicle-dropdown-template");

    panel.innerHTML = `
        <button type="button" class="cancel-choose-btn" aria-label="Cancel">Cancel</button>
        <div class="picker-main">
            <div class="picker-preview">
                <button type="button" class="picker-slot picker-slot-character" aria-label="Select character">
                    <div class="picker-slot-image"></div>
                    <span class="picker-slot-hint">Character</span>
                </button>
                <button type="button" class="picker-slot picker-slot-vehicle" aria-label="Select vehicle">
                    <div class="picker-slot-image"></div>
                    <span class="picker-slot-hint">Vehicle</span>
                </button>
            </div>
            <div class="picker-labels">
                <span class="picker-label">Character Name</span>
                <span class="picker-plus" aria-hidden="true">+</span>
                <span class="picker-label">Vehicle Name</span>
            </div>
            <button type="button" class="confirm-btn" disabled>Confirm</button>
        </div>
        <div class="picker-dropdowns" hidden>
            <div class="picker-dropdown-header">
                <button type="button" class="picker-tab picker-tab-character active" aria-label="Show characters">Characters</button>
                <button type="button" class="picker-tab picker-tab-vehicle" aria-label="Show vehicles">Vehicles</button>
            </div>
            <div class="picker-dropdown-body"></div>
        </div>
    `;

    const dropdowns = panel.querySelector(".picker-dropdowns");
    const dropdownBody = panel.querySelector(".picker-dropdown-body");
    const charTab = panel.querySelector(".picker-tab-character");
    const vehTab = panel.querySelector(".picker-tab-vehicle");

    dropdownBody.append(charDropdown, vehDropdown);
    const charBox = dropdownBody.querySelector(".dropdown-box:first-child");
    const vehBox = dropdownBody.querySelector(".dropdown-box:last-child");

    const charSlot = panel.querySelector(".picker-slot-character");
    const vehSlot = panel.querySelector(".picker-slot-vehicle");
    const charLabel = panel.querySelector(".picker-labels .picker-label:first-child");
    const vehLabel = panel.querySelector(".picker-labels .picker-label:last-child");
    const confirmBtn = panel.querySelector(".confirm-btn");

    const pick = {
        character: [charSlot.querySelector(".picker-slot-image"), charLabel, null],
        vehicle: [vehSlot.querySelector(".picker-slot-image"), vehLabel, null],
    };

    function showPicker(focus) {
        dropdowns.hidden = false;
        dropdowns.dataset.focus = focus;
        charTab.classList.toggle("active", focus === "character");
        vehTab.classList.toggle("active", focus === "vehicle");
        charBox.hidden = focus !== "character";
        vehBox.hidden = focus !== "vehicle";
    }

    panel.querySelector(".cancel-choose-btn").addEventListener("click", () => {
        removePanel(panel);
    });

    charSlot.addEventListener("click", () => showPicker("character"));
    vehSlot.addEventListener("click", () => showPicker("vehicle"));
    charTab.addEventListener("click", () => showPicker("character"));
    vehTab.addEventListener("click", () => showPicker("vehicle"));

    dropdowns.querySelectorAll(".selection").forEach((selection) => {
        selection.addEventListener("click", () => {
            const name = selection.querySelector("textPath");
            const hiddenid = selection.dataset.hiddenid;
            const isCharacter = selection.closest(".dropdown-box") === charBox;
            const imgUrl = selection.dataset.imgurl
                || selection.querySelector(".selection-pfp-img")?.getAttribute("src")
                || "";
            const focus = dropdowns.dataset.focus || (isCharacter ? "character" : "vehicle");
            const target = focus === "character" ? pick.character : pick.vehicle;
            const slot = focus === "character" ? charSlot : vehSlot;

            target[0].style.backgroundImage = imgUrl ? `url("${imgUrl}")` : "";
            target[1].textContent = name.textContent;
            target[2] = hiddenid;
            slot.classList.add("has-selection");

            confirmBtn.disabled = !(pick.character[2] && pick.vehicle[2]);
            if (focus === "character" && !pick.vehicle[2]) {
                showPicker("vehicle");
            } else if (focus === "vehicle" && !pick.character[2]) {
                showPicker("character");
            } else {
                dropdowns.hidden = true;
            }
        });
    });

    confirmBtn.addEventListener("click", async () => {
        if (!pick.character[2] || !pick.vehicle[2]) return;

        const charImg = pick.character[0].style.backgroundImage.replace(/^url\(["']?|["']?\)$/g, "");
        const vehImg = pick.vehicle[0].style.backgroundImage.replace(/^url\(["']?|["']?\)$/g, "");
        const grid = panel.closest("#compare-grid");

        panel.replaceWith(createStatsPanel(
            charImg,
            vehImg,
            pick.character[1].textContent,
            pick.vehicle[1].textContent,
            pick.character[2],
            pick.vehicle[2]
        ));

        ensureAddPanel(grid);
        updateGridLayout(grid);
    });

    return panel;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function createStatsPanel(charImg, vehImg, charName, vehName, charId, vehId) {
    const panel = document.createElement("div");
    panel.className = "comparebox stats";

    const sections = cloneTemplate("stats-sections-template");
    const uid = crypto.randomUUID().slice(0, 8);
    const safeCharName = escapeHtml(charName);
    const safeVehName = escapeHtml(vehName);
    const safeCharImg = escapeHtml(charImg);
    const safeVehImg = escapeHtml(vehImg);

    panel.innerHTML = `
        <div class="stats-card" data-character-id="${escapeHtml(charId)}" data-vehicle-id="${escapeHtml(vehId)}">
            <div class="stats-header">
                <div class="pfp-shape selected-pfp selected-character-pfp has-image" style="--imgurl: url('${safeCharImg}');">
                    <img class="pfp-img" src="${safeCharImg}" alt="" width="95" height="95" loading="eager" decoding="async" referrerpolicy="no-referrer">
                </div>
                <svg class="name-arc name-arc-character" viewBox="0 0 175 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path id="charPath-${uid}" d="M 0 18 q 87.5 20 175 0" fill="none" />
                    <text><textPath href="#charPath-${uid}" startOffset="50%" text-anchor="middle">${safeCharName}</textPath></text>
                </svg>
                <button type="button" class="eks" aria-label="Remove comparison">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </button>
                <div class="pfp-shape selected-pfp selected-vehicle-pfp has-image" style="--imgurl: url('${safeVehImg}');">
                    <img class="pfp-img" src="${safeVehImg}" alt="" width="95" height="95" loading="eager" decoding="async" referrerpolicy="no-referrer">
                </div>
                <svg class="name-arc name-arc-vehicle" viewBox="0 0 175 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path id="vehPath-${uid}" d="M 0 18 q 87.5 20 175 0" fill="none" />
                    <text><textPath href="#vehPath-${uid}" startOffset="50%" text-anchor="middle">${safeVehName}</textPath></text>
                </svg>
            </div>
        </div>
    `;

    panel.querySelector(".stats-card").appendChild(sections);
    panel.querySelector(".eks").addEventListener("click", () => removePanel(panel));
    applyComboStats(panel, charId, vehId);

    return panel;
}

function onAddClick(addPanel) {
    const grid = addPanel.closest("#compare-grid");
    const choosingPanel = createChoosingPanel();
    addPanel.replaceWith(choosingPanel);

    ensureAddPanel(grid);
    updateGridLayout(grid);
}

document.addEventListener("DOMContentLoaded", async () => {
    await preloadUrlsFromJsonElement(document.getElementById("preload-image-urls"));

    const grid = document.getElementById("compare-grid");
    grid.appendChild(createAddPanel());
    updateGridLayout(grid);
});
