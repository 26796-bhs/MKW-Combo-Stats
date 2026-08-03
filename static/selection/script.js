import { get_best_combo, get_character, get_vehicle } from "../modules/communication-service.js";
import { preloadUrlsFromJsonElement, preloadImages, setReferrerSafeImage } from "../modules/preload-images.js";

async function updateBestCombo(mapId, priority) {
    const charNameEl = document.getElementById('best-character-name');
    const vehNameEl = document.getElementById('best-vehicle-name');
    charNameEl.textContent = 'Loading…';
    vehNameEl.textContent = 'Loading…';

    try {
        const { character: charId, vehicle: vehId } = await get_best_combo(mapId, priority);

        const [charData, vehData] = await Promise.all([
            get_character(charId),
            get_vehicle(vehId),
        ]);

        const character = charData[0];
        const vehicle = vehData[0];

        setReferrerSafeImage(document.getElementById('best-character-img'), character[11]);
        charNameEl.textContent = character[1];

        setReferrerSafeImage(document.getElementById('best-vehicle-img'), vehicle[12]);
        vehNameEl.textContent = vehicle[1];
    } catch (err) {
        console.error('Failed to load best combo:', err);
        charNameEl.textContent = 'Unable to load';
        vehNameEl.textContent = 'Unable to load';
        setReferrerSafeImage(document.getElementById('best-character-img'), null);
        setReferrerSafeImage(document.getElementById('best-vehicle-img'), null);
    }
}

function selectMap(card) {
    document.querySelectorAll('.map-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');

    const imgUrl = card.dataset.imgurl || '';
    const preview = document.getElementById('map-preview-img');
    setReferrerSafeImage(preview, imgUrl || null);
    preview.alt = card.dataset.name || 'Selected map preview';

    return card.dataset.hiddenid;
}

document.addEventListener('DOMContentLoaded', async () => {
    await preloadUrlsFromJsonElement(document.getElementById('preload-image-urls'));

    // Character/vehicle images for the best-combo preview load quietly in the
    // background (no loading screen) once the map grid is already interactive.
    const backgroundUrlsEl = document.getElementById('background-preload-urls');
    if (backgroundUrlsEl) {
        let backgroundUrls = [];
        try {
            backgroundUrls = JSON.parse(backgroundUrlsEl.textContent);
        } catch (_) {
            backgroundUrls = [];
        }
        if (Array.isArray(backgroundUrls) && backgroundUrls.length > 0) {
            preloadImages(backgroundUrls).catch(() => {});
        }
    }

    const mapCards = document.querySelectorAll('.map-card');
    const prioritySelect = document.getElementById('priority-select');
    let selectedMapId = null;

    mapCards.forEach(card => {
        const imgUrl = card.dataset.imgurl || card.querySelector('.map-card-img')?.src;
        if (imgUrl) {
            card.style.setProperty('--bg-image', `url('${imgUrl}')`);
        }

        card.addEventListener('click', async () => {
            selectedMapId = selectMap(card);
            await updateBestCombo(selectedMapId, prioritySelect.value);
        });
    });

    prioritySelect.addEventListener('change', async () => {
        if (selectedMapId !== null) {
            await updateBestCombo(selectedMapId, prioritySelect.value);
        }
    });

    if (mapCards.length > 0) {
        selectedMapId = selectMap(mapCards[0]);
        await updateBestCombo(selectedMapId, prioritySelect.value);
    }
});
