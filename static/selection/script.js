import { get_best_combo, get_character, get_vehicle } from "../modules/communication-service.js";
import { preloadUrlsFromJsonElement } from "../modules/preload-images.js";

function setImage(el, url) {
    if (el.tagName === 'IMG') {
        el.src = url || '';
        return;
    }
    if (url) {
        el.style.setProperty('--imgurl', `url('${url}')`);
    } else {
        el.style.removeProperty('--imgurl');
    }
}

async function updateBestCombo(mapId, priority) {
    const { character: charId, vehicle: vehId } = await get_best_combo(mapId, priority);

    const [charData, vehData] = await Promise.all([
        get_character(charId),
        get_vehicle(vehId),
    ]);

    const character = charData[0];
    const vehicle = vehData[0];

    setImage(document.getElementById('best-character-img'), character[11]);
    document.getElementById('best-character-name').textContent = character[1];

    setImage(document.getElementById('best-vehicle-img'), vehicle[12]);
    document.getElementById('best-vehicle-name').textContent = vehicle[1];
}

function selectMap(card) {
    document.querySelectorAll('.map-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');

    const imgUrl = card.dataset.imgurl;
    const cardImg = card.querySelector('.map-card-img');
    const preview = document.getElementById('map-preview-img');
    if (cardImg?.src) {
        preview.src = cardImg.src;
        preview.alt = card.dataset.name || 'Selected map preview';
    } else {
        setImage(preview, imgUrl || null);
    }

    return card.dataset.hiddenid;
}

document.addEventListener('DOMContentLoaded', () => {
    preloadUrlsFromJsonElement(document.getElementById('preload-image-urls'));

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
        updateBestCombo(selectedMapId, prioritySelect.value);
    }
});
